import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlatformConfig {
  platform_name: string;
  logo_key: string;
  url: string;
  ratingRegex: RegExp;
  countRegex: RegExp;
}

const platformConfigs: PlatformConfig[] = [
  {
    platform_name: "ProDoctorov",
    logo_key: "prodoctorov",
    url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/",
    ratingRegex: /(\d+[.,]\d+)\s*(?:из\s*5|★|рейтинг)/i,
    countRegex: /(\d+)\s*отзыв/i,
  },
  {
    platform_name: "Яндекс.Здоровье",
    logo_key: "yandex-health",
    url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ",
    ratingRegex: /(\d+)\s*%\s*(?:рекоменд|пациент)/i,
    countRegex: /(\d+)\s*отзыв/i,
  },
  {
    platform_name: "DocDoc",
    logo_key: "docdoc",
    url: "https://docdoc.ru/doctor/Tarusin_Dmitriy",
    ratingRegex: /(\d+[.,]\d+)/,
    countRegex: /(\d+)\s*отзыв/i,
  },
];

function extractFromMarkdown(markdown: string, config: PlatformConfig): { rating: string | null; reviewCount: string | null } {
  let rating: string | null = null;
  let reviewCount: string | null = null;

  // Extract review count
  const countMatch = markdown.match(config.countRegex);
  if (countMatch) {
    reviewCount = countMatch[1];
  }

  // For Yandex, convert percentage to 5-point scale
  if (config.logo_key === "yandex-health") {
    const pctMatch = markdown.match(config.ratingRegex);
    if (pctMatch) {
      const pct = parseInt(pctMatch[1], 10);
      rating = (pct / 20).toFixed(1);
    }
  } else {
    // For others, find rating number
    const ratingMatch = markdown.match(config.ratingRegex);
    if (ratingMatch) {
      rating = ratingMatch[1].replace(",", ".");
    } else {
      // Fallback: look for a standalone number like 4.5 or 5.0 near "рейтинг" or "оценка"
      const fallback = markdown.match(/(?:рейтинг|оценка|rating)[^\d]*(\d+[.,]\d+)/i);
      if (fallback) {
        rating = fallback[1].replace(",", ".");
      }
    }
  }

  return { rating, reviewCount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Allow either service_role (scheduled jobs) or authenticated admin users
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrlEarly = Deno.env.get("SUPABASE_URL")!;
    let allowed = !!serviceKey && token === serviceKey;
    if (!allowed) {
      // Try to validate as a user JWT and check admin role
      const userClient = createClient(supabaseUrlEarly, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      const uid = userData?.user?.id;
      if (uid) {
        const admin = createClient(supabaseUrlEarly, serviceKey!);
        const { data: roleRow } = await admin
          .from("user_roles")
          .select("role")
          .eq("user_id", uid)
          .eq("role", "admin")
          .maybeSingle();
        allowed = !!roleRow;
      }
    }
    if (!allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: Record<string, { rating: string; reviewCount: string; error?: string }> = {};

    for (const config of platformConfigs) {
      try {
        console.log(`Scraping ${config.platform_name}...`);

        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: config.url,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
        
        console.log(`${config.platform_name} markdown length: ${markdown.length}`);

        const extracted = extractFromMarkdown(markdown, config);

        if (extracted.rating || extracted.reviewCount) {
          const updateData: Record<string, string> = {
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (extracted.rating) updateData.rating = extracted.rating;
          if (extracted.reviewCount) updateData.review_count = extracted.reviewCount;

          const { error: updateError } = await supabase
            .from("review_platforms")
            .update(updateData)
            .eq("logo_key", config.logo_key);

          if (updateError) {
            console.error(`Error updating ${config.logo_key}:`, updateError);
            results[config.logo_key] = { rating: extracted.rating || "N/A", reviewCount: extracted.reviewCount || "N/A", error: updateError.message };
          } else {
            results[config.logo_key] = { rating: extracted.rating || "N/A", reviewCount: extracted.reviewCount || "N/A" };
          }
        } else {
          console.error(`No data extracted for ${config.platform_name}. First 500 chars: ${markdown.substring(0, 500)}`);
          results[config.logo_key] = { rating: "N/A", reviewCount: "N/A", error: "No data extracted from markdown" };
        }
      } catch (err) {
        console.error(`Error scraping ${config.platform_name}:`, err);
        results[config.logo_key] = {
          rating: "N/A",
          reviewCount: "N/A",
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

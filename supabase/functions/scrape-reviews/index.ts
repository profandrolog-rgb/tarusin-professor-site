import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlatformConfig {
  platform_name: string;
  url: string;
  extractPrompt: string;
}

const platformConfigs: Record<string, PlatformConfig> = {
  prodoctorov: {
    platform_name: "ProDoctorov",
    url: "https://prodoctorov.ru/moskva/vrach/32554-tarusin/",
    extractPrompt:
      "Extract the doctor's rating (number like 5.0) and total number of reviews (just the number) from this page.",
  },
  "yandex-health": {
    platform_name: "Яндекс.Здоровье",
    url: "https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ",
    extractPrompt:
      "Extract the doctor's recommendation percentage and total number of reviews (just the number) from this page. Convert percentage to a 5-point scale (e.g. 92% = 4.6, 100% = 5.0).",
  },
  docdoc: {
    platform_name: "DocDoc",
    url: "https://docdoc.ru/doctor/Tarusin_Dmitriy",
    extractPrompt:
      "Extract the doctor's rating (number like 4.5) and total number of reviews (just the number) from this page.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    for (const [key, config] of Object.entries(platformConfigs)) {
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
            formats: [
              {
                type: "json",
                prompt: config.extractPrompt,
                schema: {
                  type: "object",
                  properties: {
                    rating: { type: "string", description: "Rating as a number string like 5.0 or 4.5" },
                    review_count: { type: "string", description: "Number of reviews as a plain number string like 26 or 40" },
                  },
                  required: ["rating", "review_count"],
                },
              },
            ],
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();
        console.log(`${config.platform_name} response:`, JSON.stringify(scrapeData));

        const json = scrapeData?.data?.json || scrapeData?.json;

        if (json?.rating && json?.review_count) {
          const rating = String(json.rating).replace(/[^0-9.]/g, "");
          const reviewCount = String(json.review_count).replace(/[^0-9+]/g, "");

          const { error: updateError } = await supabase
            .from("review_platforms")
            .update({
              rating,
              review_count: reviewCount,
              last_scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("logo_key", key);

          if (updateError) {
            console.error(`Error updating ${key}:`, updateError);
            results[key] = { rating, reviewCount, error: updateError.message };
          } else {
            results[key] = { rating, reviewCount };
          }
        } else {
          console.error(`No data extracted for ${config.platform_name}`);
          results[key] = { rating: "N/A", reviewCount: "N/A", error: "No data extracted" };
        }
      } catch (err) {
        console.error(`Error scraping ${config.platform_name}:`, err);
        results[key] = {
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

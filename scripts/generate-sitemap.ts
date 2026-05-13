// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://tarusin.pro";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/for-parents", changefreq: "weekly", priority: "0.9" },
  { path: "/for-doctors", changefreq: "weekly", priority: "0.8" },
  { path: "/team", changefreq: "monthly", priority: "0.7" },
  { path: "/media", changefreq: "weekly", priority: "0.7" },
  { path: "/videos", changefreq: "weekly", priority: "0.7" },
  { path: "/video-cases", changefreq: "weekly", priority: "0.7" },
  { path: "/reviews", changefreq: "weekly", priority: "0.7" },
  { path: "/contacts", changefreq: "monthly", priority: "0.7" },
  { path: "/publications", changefreq: "monthly", priority: "0.7" },
  { path: "/methodologies", changefreq: "monthly", priority: "0.7" },
  { path: "/travel-notes", changefreq: "monthly", priority: "0.6" },
  { path: "/masterclasses", changefreq: "monthly", priority: "0.6" },
  { path: "/clinical-cases", changefreq: "weekly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/research", changefreq: "weekly", priority: "0.8" },
  { path: "/qa", changefreq: "weekly", priority: "0.7" },
  { path: "/results", changefreq: "monthly", priority: "0.7" },
  { path: "/self-check", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/consent", changefreq: "yearly", priority: "0.3" },
];

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: diseases } = await supabase
      .from("disease_articles")
      .select("slug, updated_at")
      .eq("is_published", true);
    if (diseases) {
      for (const d of diseases) {
        if (d.slug) {
          entries.push({
            path: `/for-parents/${d.slug}`,
            lastmod: d.updated_at?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.6",
          });
        }
      }
    }

    // Self-check checklists (loaded from local data files at build time)
    try {
      const { allChecklists } = await import("../src/data/checklists/index");
      for (const c of allChecklists) {
        entries.push({
          path: `/self-check/${c.slug}`,
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    } catch {
      // ignore if module unavailable
    }
  } catch (err) {
    console.warn("sitemap: failed to fetch dynamic entries:", err);
  }
  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await fetchDynamicEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();

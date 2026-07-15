// Runs after `vite-react-ssg build` (postbuild hook); writes dist/sitemap.xml.
// Also writes public/sitemap.xml so the dev server serves a fresh copy.
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://tarusin.pro";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://bpbwkizvvythqotcyfii.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYndraXp2dnl0aHFvdGN5ZmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1Njc2MTQsImV4cCI6MjA4NTE0MzYxNH0.iv_pLSj27wOMUmfY0HOJ91bPm1u-b4wjiScYrP03bww";

interface SitemapEntry {
  /** «Голый» путь без префикса /en, например "/" или "/for-parents/". */
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/for-parents/", changefreq: "weekly", priority: "0.9" },
  { path: "/for-doctors/", changefreq: "weekly", priority: "0.8" },
  { path: "/team/", changefreq: "monthly", priority: "0.7" },
  { path: "/media/", changefreq: "weekly", priority: "0.7" },
  { path: "/videos/", changefreq: "weekly", priority: "0.7" },
  { path: "/video-cases/", changefreq: "weekly", priority: "0.7" },
  { path: "/reviews/", changefreq: "weekly", priority: "0.7" },
  { path: "/contacts/", changefreq: "monthly", priority: "0.7" },
  { path: "/publications/", changefreq: "monthly", priority: "0.7" },
  { path: "/methodologies/", changefreq: "monthly", priority: "0.7" },
  { path: "/travel-notes/", changefreq: "monthly", priority: "0.6" },
  { path: "/masterclasses/", changefreq: "monthly", priority: "0.6" },
  { path: "/clinical-cases/", changefreq: "weekly", priority: "0.7" },
  { path: "/blog/", changefreq: "weekly", priority: "0.8" },
  { path: "/research/", changefreq: "weekly", priority: "0.8" },
  { path: "/qa/", changefreq: "weekly", priority: "0.7" },
  { path: "/results/", changefreq: "monthly", priority: "0.7" },
  { path: "/self-check/", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy-policy/", changefreq: "yearly", priority: "0.3" },
  { path: "/consent/", changefreq: "yearly", priority: "0.3" },
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
            path: `/for-parents/${d.slug}/`,
            lastmod: d.updated_at?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.6",
          });
        }
      }
    }

    const { data: handouts } = await supabase
      .from("parents_materials")
      .select("slug, updated_at")
      .eq("kind", "handout")
      .eq("is_published", true);
    if (handouts) {
      for (const h of handouts as Array<{ slug: string | null; updated_at: string | null }>) {
        if (h.slug) {
          entries.push({
            path: `/for-parents/materials/${h.slug}/`,
            lastmod: h.updated_at?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.7",
          });
        }
      }
    }


    // Литературные обзоры для врачей — /for-doctors/research/{slug}/
    const { data: researchReviews } = await supabase
      .from("research_reviews")
      .select("slug, updated_at")
      .eq("status", "published");
    if (researchReviews) {
      for (const rr of researchReviews as Array<{ slug: string | null; updated_at: string | null }>) {
        if (rr.slug) {
          entries.push({
            path: `/for-doctors/research/${rr.slug}/`,
            lastmod: rr.updated_at?.slice(0, 10),
            changefreq: "monthly",
            priority: "0.7",
          });
        }
      }
    }

    try {
      const { allChecklists } = await import("../src/data/checklists/index");
      for (const c of allChecklists) {
        entries.push({
          path: `/self-check/${c.slug}/`,
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

function ruUrl(p: string) {
  return `${BASE_URL}${p}`;
}
function enUrl(p: string) {
  return p === "/" ? `${BASE_URL}/en/` : `${BASE_URL}/en${p}`;
}

const TODAY = new Date().toISOString().split("T")[0];

function urlBlock(loc: string, e: SitemapEntry, alts: { ru: string; en: string }) {
  return [
    `  <url>`,
    `    <loc>${loc}</loc>`,
    `    <lastmod>${e.lastmod || TODAY}</lastmod>`,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `    <xhtml:link rel="alternate" hreflang="ru" href="${alts.ru}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${alts.en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${alts.ru}"/>`,
    `  </url>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function generateSitemap(entries: SitemapEntry[]) {
  const blocks: string[] = [];
  for (const e of entries) {
    const alts = { ru: ruUrl(e.path), en: enUrl(e.path) };
    blocks.push(urlBlock(alts.ru, e, alts));
    blocks.push(urlBlock(alts.en, e, alts));
  }
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...blocks,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const dynamic = await fetchDynamicEntries();
  const all = [...staticEntries, ...dynamic];
  const xml = generateSitemap(all);

  // Always write to public/ (source of truth, served by dev server).
  writeFileSync(resolve("public/sitemap.xml"), xml);

  // If dist/ exists (post-build), also write the final artifact.
  const distDir = resolve("dist");
  if (existsSync(distDir)) {
    if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
    writeFileSync(resolve("dist/sitemap.xml"), xml);
    console.log(`sitemap.xml written to public/ and dist/ (${all.length * 2} URLs)`);
  } else {
    console.log(`sitemap.xml written to public/ (${all.length * 2} URLs)`);
  }
})();

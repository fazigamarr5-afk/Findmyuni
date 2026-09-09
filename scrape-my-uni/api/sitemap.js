// Dynamic sitemap.xml — Vercel serverless function.
//
// Serves /sitemap.xml live from Supabase so newly published blog posts and
// newly added universities appear without waiting for a redeploy. Replaces
// the old build-time scripts/generate-sitemap.js (the static public/sitemap.xml
// was deleted; a static file at the same path would shadow this function).
//
// Credentials: SUPABASE_URL + SUPABASE_ANON_KEY are used (set in the Vercel
// dashboard), with the same fallbacks as scripts/generate-university-slugs.js.
// Only publicly readable tables are queried (RLS allows anon SELECT on
// published blog_posts and universities), so the anon key is sufficient.
//
// Slug logic note: university slugs are NOT stored in the database — they are
// derived from the university name. makeSlug() below must stay byte-identical
// to makeSlug() + duplicate numbering in scripts/generate-university-slugs.js,
// otherwise sitemap URLs will not match the prerendered pages. Queries are
// ordered by name exactly like that script so duplicate numbering matches too.
//
// Failure mode: if Supabase is unreachable or credentials are missing, the
// function still returns 200 with the static pages + comparisons so
// robots.txt never points at a broken sitemap.

const SITE_URL = 'https://www.findmyuni.site';

// Static pages — keep in sync with the old generate-sitemap.js entries.
const STATIC_PAGES = [
  { path: '/', freq: 'daily', pri: '1.0' },
  { path: '/universities', freq: 'daily', pri: '0.9' },
  { path: '/blog', freq: 'weekly', pri: '0.9' },
  { path: '/compare', freq: 'weekly', pri: '0.7' },
  { path: '/about', freq: 'monthly', pri: '0.5' },
  { path: '/contact', freq: 'monthly', pri: '0.5' },
  { path: '/features', freq: 'monthly', pri: '0.5' },
];

// Comparison pages remain editorial/hardcoded, same as the old generator.
const COMPARISON_PAGES = [
  'nust-vs-lums',
  'fast-vs-nust-cs',
  'best-university-search-tools-pakistan',
];

// --- Slug generation (keep in sync with generate-university-slugs.js) ---

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60); // keep full URL under 100 chars
}

// Duplicate names get -2, -3 … appended in name order (same as build script).
function generateSlugs(unis) {
  const slugCounts = {};
  return unis.map(uni => {
    let slug = makeSlug(uni.name);

    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    return { id: uni.id, name: uni.name, slug };
  });
}

// --- Supabase REST helpers (fetch with retry, mirroring the build script) ---

function getConfig() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

async function fetchWithRetry(fullUrl, headers, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(fullUrl, {
        headers,
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < attempts) {
      const waitMs = 500 * attempt; // 0.5s, 1s backoff (function must stay fast)
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

async function fetchAllUniversities(url, key) {
  const allUnis = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetchWithRetry(
      `${url}/rest/v1/universities?select=id,name&order=name&limit=${limit}&offset=${offset}`,
      { apikey: key, Authorization: `Bearer ${key}` }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    allUnis.push(...batch);
    offset += limit;
  }

  return allUnis;
}

async function fetchPublishedBlogPosts(url, key) {
  // PostgREST allows selecting related-row timestamps even when the base-row
  // column is not exposed by RLS, so updated_at is read via updated_at alias.
  const res = await fetchWithRetry(
    `${url}/rest/v1/blog_posts?select=slug,updated_at&updated_at=not.is.null&published=eq.true&order=updated_at.desc&limit=1000`,
    { apikey: key, Authorization: `Bearer ${key}` }
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows.filter(r => r && r.slug) : [];
}

// --- XML assembly ---

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

function buildSitemap({ blogPosts, universities }) {
  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

  for (const page of STATIC_PAGES) {
    xml.push(`  <url><loc>${SITE_URL}${page.path}</loc><changefreq>${page.freq}</changefreq><priority>${page.pri}</priority></url>`);
  }

  for (const post of blogPosts) {
    const lastmod = isoDateOrNull(post.updated_at);
    xml.push(`  <url><loc>${SITE_URL}/blog/${escapeXml(post.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }

  for (const slug of COMPARISON_PAGES) {
    xml.push(`  <url><loc>${SITE_URL}/comparisons/${escapeXml(slug)}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }

  for (const uni of universities) {
    xml.push(`  <url><loc>${SITE_URL}/universities/${escapeXml(uni.slug)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }

  xml.push('</urlset>');
  return xml.join('\n');
}

// --- Handler ---

// ESM default export (this project has "type": "module"); Vercel supports it
// the same way it supports the CJS default export in api/[...path].js.
export default async function handler(req, res) {
  const { url, key } = getConfig();

  let blogPosts = [];
  let universities = [];
  let degraded = false;

  if (url && key) {
    try {
      [blogPosts, universities] = await Promise.all([
        fetchPublishedBlogPosts(url, key),
        fetchAllUniversities(url, key).then(generateSlugs),
      ]);
    } catch (e) {
      // Serve the static skeleton rather than a broken sitemap.
      console.error('sitemap: Supabase fetch failed, serving static pages only:', e.message);
      degraded = true;
    }
  } else {
    console.error('sitemap: SUPABASE_URL/SUPABASE_ANON_KEY not set, serving static pages only');
    degraded = true;
  }

  const xml = buildSitemap({ blogPosts, universities });

  res.status(200).setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Fresh hourly, serve stale while revalidating for up to a day. Search
  // engines tolerate this fine and it keeps Supabase request volume low.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  if (degraded) {
    res.setHeader('X-Sitemap-Source', 'static-fallback');
  }
  res.send(xml);
}

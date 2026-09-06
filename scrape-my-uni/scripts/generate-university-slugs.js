/**
 * Generate University Slugs
 * Fetches all universities from Supabase and generates SEO-friendly slugs.
 * Saves to a JSON file for prerendering and sitemap generation.
 *
 * Build-safe: retries the Supabase fetch with backoff, and if the fetch
 * still fails it falls back to the previously generated university-slugs.json
 * so a transient network error never breaks the Vercel build.
 *
 * Run: node scripts/generate-university-slugs.js
 */

// Load .env so local builds work out of the box (VITE_* names come from
// scrape-my-uni/.env). Vercel builds use SUPABASE_* dashboard env vars.
import 'dotenv/config';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // No credentials — this is fine as long as we have a cached slug file to
  // fall back to. Only fail when there is nothing to deploy with.
  console.warn('⚠️  SUPABASE_URL/SUPABASE_ANON_KEY not set; will use cached university-slugs.json if available.');
}

const SITE_URL = 'https://www.findmyuni.site';

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CACHE_PATH = join(import.meta.dirname, '..', 'public', 'university-slugs.json');

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60); // keep full URL under 100 chars
}

async function fetchWithRetry(batchUrl, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(batchUrl, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < attempts) {
      const waitMs = 1500 * attempt; // 1.5s, 3s backoff
      console.log(`  Supabase fetch attempt ${attempt} failed (${lastError.message}), retrying in ${waitMs / 1000}s...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

async function fetchAllUniversities() {
  const allUnis = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetchWithRetry(
      `${url}/rest/v1/universities?select=id,name&order=name&limit=${limit}&offset=${offset}`
    );
    const batch = await res.json();
    if (batch.length === 0) break;
    allUnis.push(...batch);
    offset += limit;
  }

  return allUnis;
}

function generateSlugs(unis) {
  const slugCounts = {};
  return unis.map(uni => {
    let slug = makeSlug(uni.name);

    // Handle duplicates by appending number
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    return {
      id: uni.id,
      name: uni.name,
      slug,
      url: `${SITE_URL}/universities/${slug}`
    };
  });
}

async function generateSlugsFromDb() {
  console.log('Fetching universities from Supabase...');
  const allUnis = await fetchAllUniversities();
  return generateSlugs(allUnis);
}

function loadCachedSlugs() {
  if (!existsSync(CACHE_PATH)) return null;
  try {
    const cached = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    if (Array.isArray(cached) && cached.length > 0) return cached;
  } catch (e) {
    console.log('  Cached slug file is corrupt, ignoring it');
  }
  return null;
}

async function main() {
  let slugs;

  if (url && key) {
    try {
      slugs = await generateSlugsFromDb();
    } catch (e) {
      // Network failure — fall back to the last good slug file so the build
      // continues. Fail loudly only when there is no cache at all.
      console.warn(`\n⚠️  Supabase fetch failed (${e.message})`);
      slugs = loadCachedSlugs();
    }
  } else {
    slugs = loadCachedSlugs();
  }

  if (!slugs || slugs.length === 0) {
    console.error('ERROR: No university data available (fetch failed and no cached university-slugs.json). The build cannot continue.');
    console.error('Fix: commit public/university-slugs.json and/or set SUPABASE_URL + SUPABASE_ANON_KEY in Vercel env.');
    process.exit(1);
  }
  if (url && key) {
    console.log(`Fetched ${slugs.length} universities`);
  } else {
    console.log(`Using cached university-slugs.json (${slugs.length} universities)`);
  }

  // Save to file
  writeFileSync(CACHE_PATH, JSON.stringify(slugs, null, 2));
  console.log(`Saved ${slugs.length} university slugs to public/university-slugs.json`);

  // Show sample
  console.log('\nSample slugs:');
  slugs.slice(0, 10).forEach(u => console.log(`  ${u.name} → /universities/${u.slug}`));
}

main();
// Local verification harness for api/sitemap.js.
// Run from scrape-my-uni/: node scripts/test-sitemap-fn.js
// Loads .env, invokes the real handler with a mock res, and checks:
//   1. XML is well-formed (regex sanity)
//   2. URL counts (static, comparisons, blog, universities)
//   3. University slugs are byte-identical to public/university-slugs.json
//   4. Failure path: no credentials -> still 200, static pages only
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import handlerMod from '../api/sitemap.js';
const handler = handlerMod;

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    send(b) { this.body = b; return this; },
  };
}

function countTag(xml, tag) {
  return (xml.match(new RegExp(`<${tag}>`, 'g')) || []).length;
}

let failures = 0;
function check(name, cond, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

async function run() {
  // --- Case 1: real credentials from .env ---
  const res = mockRes();
  await handler({}, res);

  check('status is 200', res.statusCode === 200);
  check('content-type is xml', (res.headers['content-type'] || '').includes('application/xml'));

  const xml = res.body;
  check('has xml declaration', xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  check('has urlset open/close', xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') && xml.trim().endsWith('</urlset>'));
  check('no unescaped ampersands', !/<loc>(?:(?!&[a-z]+;|&#\d+;)[^<])*&(?!amp;|lt;|gt;|quot;|apos;)[^<]*<\/loc>/.test(xml));
  const locs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(m => m[1]);
  check('no raw < or > inside <loc>', locs.every(l => !/[<>]/.test(l)), `${locs.length} locs checked`);

  const staticCount = countTag(xml, 'url') -
    (xml.match(/\/blog\//g) || []).length -
    (xml.match(/\/comparisons\//g) || []).length -
    (xml.match(/\/universities\//g) || []).length;
  check('7 static pages', staticCount === 7, `got ${staticCount}`);
  check('3 comparison pages', (xml.match(/\/comparisons\//g) || []).length === 3);

  const blogCount = (xml.match(/\/blog\//g) || []).length;
  check('blog posts present from Supabase', blogCount > 0, `got ${blogCount}`);

  const uniUrls = [...xml.matchAll(/<loc>https:\/\/www\.findmyuni\.site\/universities\/([^<]+)<\/loc>/g)].map(m => decodeURIComponent(m[1]));
  check('universities present from Supabase', uniUrls.length > 300, `got ${uniUrls.length}`);

  // --- Case 2: slug parity vs the committed slug file ---
  // The committed file is generated at build time, so the LIVE DB may legally
  // contain extra rows (that is the point of the dynamic sitemap). Compare as
  // a SET: every committed slug must appear in the sitemap. If makeSlug here
  // diverged from the build script, most of the 336 shared slugs would differ.
  const slugsPath = join(import.meta.dirname, '..', 'public', 'university-slugs.json');
  const committed = JSON.parse(readFileSync(slugsPath, 'utf-8')).map(u => u.slug);
  const sitemapSet = new Set(uniUrls);
  const missing = committed.filter(s => !sitemapSet.has(s));
  const coverage = ((committed.length - missing.length) / committed.length) * 100;
  check('committed slugs all present in sitemap (slug logic parity)', missing.length === 0,
    `${coverage.toFixed(1)}% covered${missing.length ? `, missing: ${missing.slice(0, 3).join(', ')}` : ''}`);

  // --- Case 3: failure path (no credentials) ---
  const savedUrl = process.env.SUPABASE_URL;
  const savedKey = process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_KEY;
  delete process.env.VITE_SUPABASE_ANON_KEY;

  const res2 = mockRes();
  const errSpy = console.error;
  const captured = [];
  console.error = (...a) => captured.push(a.join(' '));
  try {
    await handler({}, res2);
  } finally {
    console.error = errSpy;
    if (savedUrl) process.env.SUPABASE_URL = savedUrl;
    if (savedKey) process.env.SUPABASE_ANON_KEY = savedKey;
  }

  check('failure path still 200', res2.statusCode === 200);
  check('failure path serves 7 static pages', countTag(res2.body, 'url') === 7 + 3);
  check('failure path warns to stderr', captured.some(l => l.includes('sitemap:')));
  check('failure path marks fallback header', res2.headers['x-sitemap-source'] === 'static-fallback');

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch(e => { console.error('Harness crashed:', e); process.exit(1); });

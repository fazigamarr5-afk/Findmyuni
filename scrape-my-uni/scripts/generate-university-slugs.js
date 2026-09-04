/**
 * Generate University Slugs
 * Fetches all universities from Supabase and generates SEO-friendly slugs.
 * Saves to a JSON file for prerendering and sitemap generation.
 * 
 * Run: node scripts/generate-university-slugs.js
 */

const url = 'https://luribqlhnmgslpoqlxmi.supabase.co';
const key = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI0NDM2NywiZXhwIjoyMTAzODIwMzY3fQ.85X7hlYzUbKZTbaTvgDaGONdm8xwxPf-gWvWVVv11lM';
const SITE_URL = 'https://www.findmyuni.site';

import { writeFileSync } from 'fs';
import { join } from 'path';

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function generateSlugs() {
  console.log('Fetching universities from Supabase...');
  
  const allUnis = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/universities?select=id,name&order=name&limit=${limit}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    
    if (!res.ok) {
      console.error('Fetch failed:', res.status);
      break;
    }
    
    const batch = await res.json();
    if (batch.length === 0) break;
    allUnis.push(...batch);
    offset += limit;
  }
  
  console.log(`Fetched ${allUnis.length} universities`);
  
  // Generate slugs, handle duplicates
  const slugCounts = {};
  const slugs = allUnis.map(uni => {
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
  
  // Save to file
  const outputPath = join(import.meta.dirname, '..', 'public', 'university-slugs.json');
  writeFileSync(outputPath, JSON.stringify(slugs, null, 2));
  console.log(`Saved ${slugs.length} university slugs to public/university-slugs.json`);
  
  // Show sample
  console.log('\nSample slugs:');
  slugs.slice(0, 10).forEach(u => console.log(`  ${u.name} → /universities/${u.slug}`));
}

generateSlugs();

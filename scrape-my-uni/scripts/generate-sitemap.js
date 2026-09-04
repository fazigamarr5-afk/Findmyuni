/**
 * Generate sitemap.xml with slug-based URLs
 * Run: node scripts/generate-sitemap.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://www.findmyuni.site';

// Blog posts
const blogPosts = [
  'top-10-universities-pakistan-2026',
  'nust-admission-2026-guide-net-test',
  'best-cs-universities-pakistan-2026',
  'university-scholarships-pakistan-2026',
  'public-vs-private-universities-pakistan',
  'write-perfect-university-personal-statement',
  'hec-university-categories-wxyz-explained',
  'engineering-admissions-pakistan-2026-ecat',
  'career-options-pakistani-graduates-2026',
  'pakistani-students-studying-abroad-guide'
];

function generate() {
  const xml = [];
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  
  // Static pages
  const staticPages = [
    { path: '/', freq: 'daily', pri: '1.0' },
    { path: '/universities', freq: 'daily', pri: '0.9' },
    { path: '/blog', freq: 'weekly', pri: '0.9' },
    { path: '/compare', freq: 'weekly', pri: '0.7' },
    { path: '/about', freq: 'monthly', pri: '0.5' },
    { path: '/contact', freq: 'monthly', pri: '0.5' },
    { path: '/features', freq: 'monthly', pri: '0.5' },
  ];
  
  for (const page of staticPages) {
    xml.push(`  <url><loc>${SITE_URL}${page.path}</loc><changefreq>${page.freq}</changefreq><priority>${page.pri}</priority></url>`);
  }
  
  // Blog posts
  for (const slug of blogPosts) {
    xml.push(`  <url><loc>${SITE_URL}/blog/${slug}</loc><lastmod>2026-09-04</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }
  
  // University pages (from slug file)
  const slugsPath = join(import.meta.dirname, '..', 'public', 'university-slugs.json');
  try {
    const unis = JSON.parse(readFileSync(slugsPath, 'utf-8'));
    for (const uni of unis) {
      xml.push(`  <url><loc>${SITE_URL}/universities/${uni.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
    }
    console.log(`Added ${unis.length} university URLs`);
  } catch (e) {
    console.log('Warning: university-slugs.json not found');
  }
  
  xml.push('</urlset>');
  
  const outputPath = join(import.meta.dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml.join('\n'));
  console.log(`Sitemap generated: ${outputPath}`);
}

generate();

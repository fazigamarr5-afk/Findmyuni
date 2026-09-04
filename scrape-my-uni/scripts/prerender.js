/**
 * Prerender Script — Generates static HTML for key routes
 * with unique <title>, <meta description>, and basic content.
 * 
 * This fixes the #1 SEO problem: Google seeing identical HTML for every page.
 * 
 * Run after `vite build`: node scripts/prerender.js
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const DIST = join(import.meta.dirname, '..', 'dist');
const SITE_URL = 'https://www.findmyuni.site';

// Blog post metadata (from Supabase seed data)
const blogPosts = [
  {
    slug: 'top-10-universities-pakistan-2026',
    title: 'Top 10 Universities in Pakistan 2026: Complete Ranking Guide (QS, HEC & More)',
    description: 'Definitive ranking of Pakistan\'s top 10 universities for 2026 — QS rankings, HEC categories, research output, graduate employment rates. Compare NUST, LUMS, COMSATS, FAST & more.',
    category: 'Rankings',
    content: 'Comprehensive ranking of Pakistan\'s top 10 universities using QS World Rankings, HEC categories, research output, and graduate employment data.'
  },
  {
    slug: 'nust-admission-2026-guide-net-test',
    title: 'NUST Admission 2026: Complete Guide to NET Test, Deadlines, Fee Structure & Programs',
    description: 'Everything about NUST admissions 2026 — NET test preparation, eligibility, all programs, fee structure, scholarships, and step-by-step application process.',
    category: 'Admissions',
    content: 'Complete guide to NUST admissions including NET test format, 3-month preparation plan, all programs, fee structure, and scholarship opportunities.'
  },
  {
    slug: 'best-cs-universities-pakistan-2026',
    title: 'Best CS Universities in Pakistan 2026: Rankings, Fee Structure & Career Prospects',
    description: 'Compare the best CS universities in Pakistan — FAST, NUST, COMSATS, LUMS with real salary data, curriculum analysis, and career prospects.',
    category: 'Programs',
    content: 'Data-driven comparison of Pakistan\'s top CS universities with salary comparisons, curriculum analysis, and career outcome data.'
  },
  {
    slug: 'university-scholarships-pakistan-2026',
    title: 'University Scholarships in Pakistan 2026: Complete Guide to Every Available Financial Aid',
    description: 'Every scholarship available for Pakistani students in 2026 — merit-based, need-based, HEC, PEEF, Ehsaas, private sector, and international scholarships.',
    category: 'Scholarships',
    content: 'Complete guide to every scholarship category in Pakistan with eligibility criteria, deadlines, amounts, and application tips.'
  },
  {
    slug: 'public-vs-private-universities-pakistan',
    title: 'Public vs Private Universities in Pakistan 2026: Which One Should You Choose?',
    description: 'Honest comparison of public and private universities — real fee structures, education quality, employment outcomes, and ROI analysis.',
    category: 'Guides',
    content: 'Data-driven comparison of public vs private universities covering fees, quality, career outcomes, and return on investment.'
  },
  {
    slug: 'write-perfect-university-personal-statement',
    title: 'How to Write a Winning University Personal Statement: Complete Guide',
    description: 'Step-by-step guide to writing a compelling personal statement with real examples, templates, and tips for LUMS, NUST, and international applications.',
    category: 'Guides',
    content: 'Complete guide to writing personal statements with 6-paragraph structure, real examples, common mistakes, and fill-in-the-blank template.'
  },
  {
    slug: 'hec-university-categories-wxyz-explained',
    title: 'HEC University Categories Explained: What W, X, Y, Z Mean for Your Degree',
    description: 'Understand HEC\'s W, X, Y, Z categories — what each means, which universities fall in each tier, and how it affects your degree value.',
    category: 'Rankings',
    content: 'Complete guide to HEC university categories explaining W, X, Y, Z tiers and their impact on degree recognition and career prospects.'
  },
  {
    slug: 'engineering-admissions-pakistan-2026-ecat',
    title: 'Engineering Admissions in Pakistan 2026: ECAT, Entry Tests, Deadlines & Guide',
    description: 'Complete guide to engineering admissions — ECAT, NUST NET, FAST Test, GIKI Test with preparation plans, university comparison, and timelines.',
    category: 'Admissions',
    content: 'Comprehensive guide to engineering admissions covering all entry tests, preparation strategies, and university comparison.'
  },
  {
    slug: 'career-options-pakistani-graduates-2026',
    title: 'Career Options for Pakistani Graduates 2026: Salary Data & Job Market Trends',
    description: 'Real salary data, job market trends, freelancing opportunities, and the best career paths for Pakistani graduates by field of study.',
    category: 'Career',
    content: 'Comprehensive career guide with real salary data, job market analysis, freelancing opportunities, and overseas prospects.'
  },
  {
    slug: 'pakistani-students-studying-abroad-guide',
    title: 'Pakistani Students Guide to Studying Abroad 2026: Countries, Scholarships & Visa',
    description: 'Complete guide for studying abroad — UK, Australia, Germany, Canada with scholarships, visa process, cost breakdown, and IELTS tips.',
    category: 'Career',
    content: 'Complete study abroad guide covering top countries, scholarships, visa process, cost comparison, and IELTS preparation.'
  }
];

// Static page metadata
const staticPages = [
  {
    path: '',
    title: 'FindMyUni - Find & Compare Universities in Pakistan | Admissions 2026',
    description: 'Discover 336+ Pakistani universities, compare programs (BS/MS/PhD), check QS/HEC rankings, scholarships, admission deadlines, and apply online.',
    content: 'Pakistan\'s most comprehensive university finder. Compare 336+ universities with programs, rankings, scholarships, and admission deadlines.'
  },
  {
    path: 'blog',
    title: 'Blog | University Admissions Guide for Pakistani Students | FindMyUni',
    description: 'Expert guides on university admissions, scholarships, program comparisons, and education tips for Pakistani students. Stay updated with latest admission news.',
    content: 'Expert guides, tips, and news to help you navigate university admissions in Pakistan.'
  },
  {
    path: 'about',
    title: 'About FindMyUni - Our Mission to Help Pakistani Students | FindMyUni',
    description: 'Learn about FindMyUni\'s mission to help Pakistani students find and compare universities with comprehensive data on programs, rankings, and admissions.',
    content: 'FindMyUni helps Pakistani students make informed decisions about university education.'
  },
  {
    path: 'contact',
    title: 'Contact FindMyUni - Get in Touch | FindMyUni',
    description: 'Have questions about university admissions in Pakistan? Contact FindMyUni for help with university selection, applications, and scholarships.',
    content: 'Get in touch with FindMyUni for assistance with university admissions.'
  },
  {
    path: 'features',
    title: 'Features - University Comparison, Rankings & Admission Tools | FindMyUni',
    description: 'Explore FindMyUni features: university comparison tool, QS/HEC rankings, admission deadline tracker, scholarship finder, and AI-powered assistance.',
    content: 'Powerful tools to help you find and compare universities.'
  },
  {
    path: 'universities',
    title: 'All Universities in Pakistan - Complete Database | FindMyUni',
    description: 'Browse all 336+ universities in Pakistan. Filter by location, sector, programs, and rankings. Find the perfect university for your future.',
    content: 'Complete database of Pakistani universities with programs, rankings, and admission details.'
  },
  {
    path: 'compare',
    title: 'Compare Universities Side-by-Side | FindMyUni',
    description: 'Compare Pakistani universities side-by-side. Check programs, fees, rankings, and admission requirements to make the right choice.',
    content: 'Compare universities to make an informed decision.'
  }
];

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateBlogPostHtml(template, post) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);
  const url = `${SITE_URL}/blog/${post.slug}`;
  
  let html = template;
  
  // Replace title
  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | FindMyUni</title>`);
  
  // Replace meta description
  html = html.replace(
    /<meta name="description" content=".*?"/,
    `<meta name="description" content="${description}"`
  );
  
  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content=".*?"/,
    `<meta property="og:url" content="${url}"`
  );
  html = html.replace(
    /<meta property="og:title" content=".*?"/,
    `<meta property="og:title" content="${title}"`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"/,
    `<meta property="og:description" content="${description}"`
  );
  html = html.replace(
    /<meta property="og:type" content="website"/,
    `<meta property="og:type" content="article"`
  );
  
  // Replace Twitter tags
  html = html.replace(
    /<meta property="twitter:url" content=".*?"/,
    `<meta property="twitter:url" content="${url}"`
  );
  html = html.replace(
    /<meta property="twitter:title" content=".*?"/,
    `<meta property="twitter:title" content="${title}"`
  );
  html = html.replace(
    /<meta property="twitter:description" content=".*?"/,
    `<meta property="twitter:description" content="${description}"`
  );
  
  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href=".*?"/,
    `<link rel="canonical" href="${url}"`
  );
  
  // Fix WebSite structured data URLs
  html = html.replace(/findmyuni\.pk/g, 'www.findmyuni.site');
  
  // Add Article structured data
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: { '@type': 'Organization', name: 'FindMyUni' },
    publisher: { '@type': 'Organization', name: 'FindMyUni' },
    url: url,
    datePublished: '2026-09-04',
    dateModified: '2026-09-04'
  });
  
  html = html.replace(
    /<\/head>/,
    `    <script type="application/ld+json">${articleSchema}</script>\n  </head>`
  );
  
  return html;
}

function generateStaticPageHtml(template, page) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const url = page.path ? `${SITE_URL}/${page.path}` : `${SITE_URL}/`;
  
  let html = template;
  
  // Replace title
  html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  
  // Replace meta description
  html = html.replace(
    /<meta name="description" content=".*?"/,
    `<meta name="description" content="${description}"`
  );
  
  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content=".*?"/,
    `<meta property="og:url" content="${url}"`
  );
  html = html.replace(
    /<meta property="og:title" content=".*?"/,
    `<meta property="og:title" content="${title}"`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?"/,
    `<meta property="og:description" content="${description}"`
  );
  
  // Replace Twitter tags
  html = html.replace(
    /<meta property="twitter:url" content=".*?"/,
    `<meta property="twitter:url" content="${url}"`
  );
  html = html.replace(
    /<meta property="twitter:title" content=".*?"/,
    `<meta property="twitter:title" content="${title}"`
  );
  html = html.replace(
    /<meta property="twitter:description" content=".*?"/,
    `<meta property="twitter:description" content="${description}"`
  );
  
  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href=".*?"/,
    `<link rel="canonical" href="${url}"`
  );
  
  // Fix WebSite structured data URLs
  html = html.replace(/findmyuni\.pk/g, 'www.findmyuni.site');
  
  return html;
}

function main() {
  const indexPath = join(DIST, 'index.html');
  
  if (!existsSync(indexPath)) {
    console.error('❌ dist/index.html not found. Run `vite build` first.');
    process.exit(1);
  }
  
  const template = readFileSync(indexPath, 'utf-8');
  let count = 0;
  
  // Generate blog post pages
  console.log('📝 Generating blog post pages...');
  for (const post of blogPosts) {
    const dir = join(DIST, 'blog', post.slug);
    mkdirSync(dir, { recursive: true });
    const html = generateBlogPostHtml(template, post);
    writeFileSync(join(dir, 'index.html'), html);
    count++;
    console.log(`  ✅ /blog/${post.slug}`);
  }
  
  // Generate blog list page
  console.log('\n📝 Generating static pages...');
  for (const page of staticPages) {
    const dir = page.path ? join(DIST, ...page.path.split('/')) : DIST;
    mkdirSync(dir, { recursive: true });
    const html = generateStaticPageHtml(template, page);
    writeFileSync(join(dir, 'index.html'), html);
    count++;
    console.log(`  ✅ /${page.path || ''}`);
  }
  
  console.log(`\n🎉 Pre-rendered ${count} pages successfully!`);
}

main();

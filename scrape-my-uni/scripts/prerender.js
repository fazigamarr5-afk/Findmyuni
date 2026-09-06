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
    content: 'Comprehensive ranking of Pakistan\'s top 10 universities using QS World Rankings, HEC categories, research output, and graduate employment data.',
    faq: [
      { q: 'Which university is number 1 in Pakistan in 2026?', a: 'NUST currently holds the top spot, followed closely by LUMS, COMSATS and FAST. The order shifts a little every year depending on QS and HEC rankings.' },
      { q: 'How many universities are there in Pakistan?', a: 'More than 336 universities are recognized by the HEC across public and private sectors. You can browse the full list on FindMyUni.' },
      { q: 'When do university admissions for 2026 open in Pakistan?', a: 'Most universities open fall 2026 admissions between June and September, though private universities like LUMS and FAST start earlier. Deadlines vary by university and program.' },
      { q: 'Which is better — FAST or NUST?', a: 'For computer science and software engineering, FAST has the stronger industry reputation, while NUST wins on overall rankings and campus life. It depends on your program and career goals.' },
    ],
  },
  {
    slug: 'nust-admission-2026-guide-net-test',
    title: 'NUST Admission 2026: Complete Guide to NET Test, Deadlines, Fee Structure & Programs',
    description: 'Everything about NUST admissions 2026 — NET test preparation, eligibility, all programs, fee structure, scholarships, and step-by-step application process.',
    category: 'Admissions',
    content: 'Complete guide to NUST admissions including NET test format, 3-month preparation plan, all programs, fee structure, and scholarship opportunities.',
    faq: [
      { q: 'When is the NUST NET test in 2026?', a: 'NUST runs three NET series every year: Series I in March, Series II in June, and Series III in September. Each series is a separate shot at admission.' },
      { q: 'How much does the NUST NET cost?', a: 'The NET fee is around PKR 5,000 per attempt. Registration happens online at nust.edu.pk.' },
      { q: 'How much does a 4-year degree at NUST cost?', a: 'Expect roughly PKR 5-7 lakhs in total — tuition plus hostel. That is a fraction of what comparable private universities charge.' },
      { q: 'What is NUST\'s QS World Ranking?', a: 'NUST is ranked around #383 globally in the QS World University Rankings, making it the highest-ranked public university in Pakistan for engineering and technology.' },
      { q: 'Is NUST good for computer science?', a: 'Yes — the SEECS campus runs one of the strongest CS programs in the country, with strong research output and solid placement in the Islamabad tech scene.' },
    ],
  },
  {
    slug: 'best-cs-universities-pakistan-2026',
    title: 'Best CS Universities in Pakistan 2026: Rankings, Fee Structure & Career Prospects',
    description: 'Compare the best CS universities in Pakistan — FAST, NUST, COMSATS, LUMS with real salary data, curriculum analysis, and career prospects.',
    category: 'Programs',
    content: 'Data-driven comparison of Pakistan\'s top CS universities with salary comparisons, curriculum analysis, and career outcome data.',
    faq: [
      { q: 'Which university is best for computer science in Pakistan?', a: 'FAST-NUCES has the strongest industry reputation, NUST (SEECS) is the best overall package for rankings and research, while COMSATS offers the best value for money.' },
      { q: 'How much does a CS graduate earn in Pakistan?', a: 'Fresh CS graduates earn between PKR 40,000 and 80,000 per month. After 3-5 years that jumps to PKR 150,000-300,000, with FAST and NUST graduates at the top of the range.' },
      { q: 'How much is CS tuition at FAST, NUST, and COMSATS?', a: 'FAST charges around PKR 180,000 per semester, NUST around PKR 120,000, and COMSATS around PKR 80,000. Over four years, FAST is the most expensive of the three.' },
      { q: 'Is a CS degree from Pakistan recognized abroad?', a: 'Yes — CS degrees from HEC Category W universities like NUST, FAST, and LUMS are recognized internationally, especially for MS/PhD admissions.' },
    ],
  },
  {
    slug: 'university-scholarships-pakistan-2026',
    title: 'University Scholarships in Pakistan 2026: Complete Guide to Every Available Financial Aid',
    description: 'Every scholarship available for Pakistani students in 2026 — merit-based, need-based, HEC, PEEF, Ehsaas, private sector, and international scholarships.',
    category: 'Scholarships',
    content: 'Complete guide to every scholarship category in Pakistan with eligibility criteria, deadlines, amounts, and application tips.',
    faq: [
      { q: 'How can I get a full scholarship in Pakistan?', a: 'The main routes are HEC scholarships, NUST merit scholarships (up to 100% tuition for top NET scorers), LUMS NOP, and PEEF for Punjab\'s top position holders. Start applications early.' },
      { q: 'How much does the Ehsaas undergraduate scholarship pay?', a: 'The Ehsaas Undergraduate Scholarship covers PKR 40,000-80,000 per year depending on need, and it is renewable if you maintain your grades.' },
      { q: 'When should I apply for scholarships in Pakistan?', a: 'Most major scholarships open between October and January for the next academic year. Need-based programs are tied to admission timelines.' },
      { q: 'Which private companies offer scholarships in Pakistan?', a: 'Engro (engineering), Nestlé (business and engineering), Unilever (business administration), and Zong (IT and telecom) all run scholarship programs.' },
    ],
  },
  {
    slug: 'public-vs-private-universities-pakistan',
    title: 'Public vs Private Universities in Pakistan 2026: Which One Should You Choose?',
    description: 'Honest comparison of public and private universities — real fee structures, education quality, employment outcomes, and ROI analysis.',
    category: 'Guides',
    content: 'Data-driven comparison of public vs private universities covering fees, quality, career outcomes, and return on investment.',
    faq: [
      { q: 'Are private universities better than public universities in Pakistan?', a: 'Not automatically. FAST and LUMS justify their fees with strong industry networks, but NUST, COMSATS, and Punjab University deliver excellent education at a fraction of the cost.' },
      { q: 'How much does a private university cost in Pakistan?', a: 'Private universities charge roughly PKR 150,000-400,000 per year, which works out to PKR 6-16 lakhs for a 4-year degree. Public universities cost up to 10x less.' },
      { q: 'Which Pakistani universities give the best value for money?', a: 'Punjab University and BZU are the cheapest strong options, COMSATS offers a great quality-to-price ratio, and FAST delivers the best return on investment for tech careers.' },
      { q: 'Do employers care whether you studied at a public or private university?', a: 'Mostly no — they care about the university\'s reputation and your skills. FAST, LUMS, and NUST grads dominate top tech companies regardless of sector.' },
    ],
  },
  {
    slug: 'write-perfect-university-personal-statement',
    title: 'How to Write a Winning University Personal Statement: Complete Guide',
    description: 'Step-by-step guide to writing a compelling personal statement with real examples, templates, and tips for LUMS, NUST, and international applications.',
    category: 'Guides',
    content: 'Complete guide to writing personal statements with 6-paragraph structure, real examples, common mistakes, and fill-in-the-blank template.',
    faq: [
      { q: 'How long should a personal statement be?', a: 'Most Pakistani and international universities ask for 500-1000 words. LUMS, IBA, and foreign universities specify exact limits — check each application page.' },
      { q: 'Do Pakistani universities require a personal statement?', a: 'Yes, for many programs — especially private universities like LUMS, IBA, and FAST, plus most study-abroad applications.' },
      { q: 'What should you avoid in a personal statement?', a: 'Generic openers like "I love computers", copied paragraphs from the internet, listing achievements, and trashing other schools. Specifics and honesty win.' },
    ],
  },
  {
    slug: 'hec-university-categories-wxyz-explained',
    title: 'HEC University Categories Explained: What W, X, Y, Z Mean for Your Degree',
    description: 'Understand HEC\'s W, X, Y, Z categories — what each means, which universities fall in each tier, and how it affects your degree value.',
    category: 'Rankings',
    content: 'Complete guide to HEC university categories explaining W, X, Y, Z tiers and their impact on degree recognition and career prospects.',
    faq: [
      { q: 'What is the HEC W category?', a: 'W is the HEC\'s top tier — universities with 80%+ PhD faculty, strong research output, and international recognition. NUST, LUMS, FAST, Aga Khan University, COMSATS, and QAU fall in it.' },
      { q: 'Is a W category degree better than an X category degree?', a: 'For international recognition, scholarships, and multinational employers, yes. X category degrees are still solid for careers inside Pakistan.' },
      { q: 'How do I check my university\'s HEC category?', a: 'Search any university on FindMyUni — the HEC category is listed alongside rankings, programs, and admission details.' },
      { q: 'What happens if my university is Z category?', a: 'A Z category degree is recognized but carries serious reservations. Some employers may not accept it, and scholarship options are limited.' },
    ],
  },
  {
    slug: 'engineering-admissions-pakistan-2026-ecat',
    title: 'Engineering Admissions in Pakistan 2026: ECAT, Entry Tests, Deadlines & Guide',
    description: 'Complete guide to engineering admissions — ECAT, NUST NET, FAST Test, GIKI Test with preparation plans, university comparison, and timelines.',
    category: 'Admissions',
    content: 'Comprehensive guide to engineering admissions covering all entry tests, preparation strategies, and university comparison.',
    faq: [
      { q: 'When is ECAT 2026 in Pakistan?', a: 'ECAT registration usually runs from March to April, with the test in May. UET admission applications follow in June-July and merit lists come out in August.' },
      { q: 'Is ECAT mandatory for every engineering university?', a: 'Not all. ECAT applies to Punjab universities like UET Lahore, BZU, and GCUF. NUST uses its own NET, FAST and GIKI run their own tests, and COMSATS has its own entry exam.' },
      { q: 'What is the passing score for ECAT?', a: 'There is no fixed pass mark — ECAT is merit-based. A 50%+ ECAT score keeps you competitive at most Punjab universities.' },
      { q: 'Which is the best engineering university in Pakistan?', a: 'UET Lahore leads Punjab for traditional engineering, NUST is the top overall, NED dominates in Karachi, and GIKI is the premium private option.' },
    ],
  },
  {
    slug: 'career-options-pakistani-graduates-2026',
    title: 'Career Options for Pakistani Graduates 2026: Salary Data & Job Market Trends',
    description: 'Real salary data, job market trends, freelancing opportunities, and the best career paths for Pakistani graduates by field of study.',
    category: 'Career',
    content: 'Comprehensive career guide with real salary data, job market analysis, freelancing opportunities, and overseas prospects.',
    faq: [
      { q: 'Which degree has the best job prospects in Pakistan?', a: 'Computer science and IT lead the pack — the sector is growing 20%+ a year with $2.5B+ in exports. Software engineering, AI/ML, and cybersecurity roles pay the most.' },
      { q: 'How much do fresh graduates earn in Pakistan?', a: 'CS/IT grads start at PKR 40,000-80,000 per month, engineers at PKR 45,000-70,000, and business graduates around PKR 40,000-60,000.' },
      { q: 'Can Pakistani graduates earn in dollars?', a: 'Yes — Pakistan is the 4th largest freelancing country in the world. Developers, designers, and content writers earn $10-50/hour on Fiverr and Upwork.' },
    ],
  },
  {
    slug: 'pakistani-students-studying-abroad-guide',
    title: 'Pakistani Students Guide to Studying Abroad 2026: Countries, Scholarships & Visa',
    description: 'Complete guide for studying abroad — UK, Australia, Germany, Canada with scholarships, visa process, cost breakdown, and IELTS tips.',
    category: 'Career',
    content: 'Complete study abroad guide covering top countries, scholarships, visa process, cost comparison, and IELTS preparation.',
    faq: [
      { q: 'Which country is best for Pakistani students to study abroad?', a: 'The UK offers the fastest route to a degree (1-year Master\'s) with a 2-year work visa. Germany is the cheapest — public universities are tuition-free. Canada has the easiest path to permanent residency.' },
      { q: 'How much does it cost to study in the UK from Pakistan?', a: 'A Master\'s in the UK costs roughly PKR 40-80 lakhs all-in, including living costs. Germany comes in far cheaper at PKR 15-25 lakhs because public tuition is free.' },
      { q: 'Can I study in Germany for free as a Pakistani student?', a: 'Yes — German public universities don\'t charge tuition. You\'ll need around EUR 11,208 in a blocked account for living costs, plus an APS certificate.' },
      { q: 'Which scholarships are fully funded for Pakistani students?', a: 'Chevening (UK), the Commonwealth Scholarship, Australia Awards, and HEC\'s overseas programs cover tuition and living costs. They are competitive — apply 6-12 months before your program starts.' },
    ],
  },
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

// Seed visible text into the empty #root shell so crawlers see content in the
// raw HTML. React replaces these children when it mounts, so users are unaffected.
function injectBody(html, bodyHtml) {
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${bodyHtml}</div>`);
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*|`_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function introParagraph(text, maxLen = 500) {
  const clean = stripMarkdown(text);
  return clean.length > maxLen ? clean.slice(0, maxLen).trimEnd() + '…' : clean;
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
  
  // Fix og:image and twitter:image to use www
  html = html.replace(/content="https:\/\/findmyuni\.site\//g, 'content="https://www.findmyuni.site/');
  
  // Add Article + BreadcrumbList + FAQPage structured data
  const schemas = [
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      author: { '@type': 'Person', name: 'FindMyUni Team', url: `${SITE_URL}/about` },
      publisher: { '@type': 'Organization', name: 'FindMyUni', url: SITE_URL },
      url: url,
      datePublished: '2026-09-04',
      dateModified: '2026-09-04'
    }),
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title }
      ]
    })
  ];
  if (post.faq && post.faq.length > 0) {
    schemas.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }));
  }
  
  html = html.replace(
    /<\/head>/,
    schemas.map(s => `    <script type="application/ld+json">${s}</script>`).join('\n') + '\n  </head>'
  );
  
  // Seed visible body content for crawlers
  const intro = introParagraph(post.content, 900);
  let bodyHtml =
    `<h1>${title}</h1>` +
    `<p>${description}</p>` +
    (intro ? `<p>${escapeHtml(intro)}</p>` : '');
  if (post.faq && post.faq.length > 0) {
    bodyHtml +=
      '<h2>Frequently Asked Questions</h2>' +
      post.faq.map(f => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('');
  }
  html = injectBody(html, bodyHtml);
  
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
  
  // Fix og:image and twitter:image to use www
  html = html.replace(/content="https:\/\/findmyuni\.site\//g, 'content="https://www.findmyuni.site/');
  
  // Seed visible body content for crawlers
  const bodyHtml = `<h1>${title}</h1><p>${description}</p>`;
  html = injectBody(html, bodyHtml);
  
  return html;
}

function generateUniversityHtml(template, uni) {
  const title = escapeHtml(uni.name);
  const description = escapeHtml(`${uni.name} — programs, QS/HEC rankings, admission deadlines, fee structure, and scholarships. Compare on FindMyUni.`);
  const url = `${SITE_URL}/universities/${uni.slug}`;
  
  let html = template;
  
  // Replace title
  html = html.replace(/<title>.*?<\/title>/, `<title>${title} | FindMyUni</title>`);
  
  // Replace meta description
  html = html.replace(
    /<meta name="description" content=".*?"/,
    `<meta name="description" content="${description}"`
  );
  
  // Replace OG tags
  html = html.replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${url}"`);
  html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${title}"`);
  html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${description}"`);
  html = html.replace(/<meta property="og:type" content="website"/, `<meta property="og:type" content="university"`);
  
  // Replace Twitter tags
  html = html.replace(/<meta property="twitter:url" content=".*?"/, `<meta property="twitter:url" content="${url}"`);
  html = html.replace(/<meta property="twitter:title" content=".*?"/, `<meta property="twitter:title" content="${title}"`);
  html = html.replace(/<meta property="twitter:description" content=".*?"/, `<meta property="twitter:description" content="${description}"`);
  
  // Replace canonical
  html = html.replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${url}"`);
  
  // Fix WebSite structured data URLs
  html = html.replace(/findmyuni\.pk/g, 'www.findmyuni.site');
  
  // Add EducationalOrganization structured data
  const orgSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: uni.name,
    url: url
  });
  html = html.replace(
    /<\/head>/,
    `    <script type="application/ld+json">${orgSchema}</script>\n  </head>`
  );
  
  // Seed visible body content for crawlers
  const bodyHtml = `<h1>${title}</h1><p>${description}</p>`;
  html = injectBody(html, bodyHtml);
  
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
  
  // Generate university pages
  console.log('\n🏫 Generating university pages...');
  const slugsPath = join(import.meta.dirname, '..', 'public', 'university-slugs.json');
  if (existsSync(slugsPath)) {
    const unis = JSON.parse(readFileSync(slugsPath, 'utf-8'));
    for (const uni of unis) {
      const dir = join(DIST, 'universities', uni.slug);
      mkdirSync(dir, { recursive: true });
      const html = generateUniversityHtml(template, uni);
      writeFileSync(join(dir, 'index.html'), html);
      count++;
    }
    console.log(`  ✅ ${unis.length} university pages generated`);
  } else {
    console.log('  ⚠️ university-slugs.json not found, skipping university pages');
  }
  
  console.log(`\n🎉 Pre-rendered ${count} pages successfully!`);
}

main();

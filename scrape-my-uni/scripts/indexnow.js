/**
 * IndexNow Ping Script
 * Notifies Bing, Yandex, Naver, and other IndexNow-supported engines
 * when content changes for faster indexing.
 * 
 * Usage: node scripts/indexnow.js [url]
 * Example: node scripts/indexnow.js https://www.findmyuni.site/blog/top-10-universities-pakistan-2026
 * 
 * Without arguments, pings all key pages.
 */

const SITE_URL = 'https://www.findmyuni.site';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

// IndexNow key (generated once, stored in public for verification)
const INDEXNOW_KEY = 'findmyuni-site-key-2026';

const pages = [
  '/',
  '/blog',
  '/blog/top-10-universities-pakistan-2026',
  '/blog/nust-admission-2026-guide-net-test',
  '/blog/best-cs-universities-pakistan-2026',
  '/blog/university-scholarships-pakistan-2026',
  '/blog/public-vs-private-universities-pakistan',
  '/blog/write-perfect-university-personal-statement',
  '/blog/hec-university-categories-wxyz-explained',
  '/blog/engineering-admissions-pakistan-2026-ecat',
  '/blog/career-options-pakistani-graduates-2026',
  '/blog/pakistani-students-studying-abroad-guide',
  '/about',
  '/contact',
  '/features',
  '/universities',
  '/compare',
];

async function pingIndexNow(urls) {
  const payload = {
    host: 'www.findmyuni.site',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.map(url => url.startsWith('http') ? url : `${SITE_URL}${url}`),
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`✅ IndexNow ping sent for ${urls.length} URLs (status: ${res.status})`);
    } else {
      console.log(`⚠️ IndexNow responded with status ${res.status}`);
    }
  } catch (err) {
    console.log(`❌ IndexNow ping failed: ${err.message}`);
  }
}

// Get URLs from command line or use all pages
const args = process.argv.slice(2);
const urls = args.length > 0 ? args : pages;

pingIndexNow(urls);

const fs = require('fs');
const path = 'C:/Users/ASA/.verdent/verdent-projects/i-have-a-website/FindMyUni/scrape-my-uni/dist/blog/top-10-universities-pakistan-2026/index.html';
const h = fs.readFileSync(path, 'utf8');
const schemas = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(m => { try { return JSON.parse(m[1].trim()); } catch (e) { return { '@type': 'PARSE_FAIL' }; } });
console.log('Schema types:', schemas.map(s => s['@type']).join(', '));
const body = h.match(/<div id="root">([\s\S]*?)<\/div>/)[1];
console.log('Body length:', body.length);
console.log('H1:', (body.match(/<h1>([^<]*)<\/h1>/) || [])[1]);
console.log('FAQ heading present:', body.includes('Frequently Asked Questions'));
console.log('FAQ Q count:', (body.match(/<h3>/g) || []).length);
console.log('FAQPage schema present:', h.includes('FAQPage'));
console.log('findmyuni.com present:', h.includes('findmyuni.com'));
console.log('canonical:', (h.match(/rel="canonical" href="([^"]*)"/) || [])[1]);
console.log('og:url:', (h.match(/property="og:url" content="([^"]*)"/) || [])[1]);

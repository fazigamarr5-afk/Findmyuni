"""Generate sitemap.xml with all university URLs from Supabase."""
import requests

SUPABASE_URL = "https://luribqlhnmgslpoqlxmi.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQzNjcsImV4cCI6MjEwMzgyMDM2N30.IvnGUPVueylQjCkD5UPVtAosM3XKI3KNBkdCf2UbGus"
BASE = "https://findmyuni.pk"

xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

# Static pages
for page, freq, pri in [("/", "daily", "1.0"), ("/universities", "daily", "0.9"),
                          ("/compare", "weekly", "0.7"), ("/about", "monthly", "0.5"),
                          ("/contact", "monthly", "0.5"), ("/features", "monthly", "0.5")]:
    xml.append(f'  <url><loc>{BASE}{page}</loc><changefreq>{freq}</changefreq><priority>{pri}</priority></url>')

# University pages
offset = 0
count = 0
while True:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/universities",
                     headers={"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"},
                     params={"select": "id,updated_at", "offset": offset, "limit": 100})
    if r.status_code not in (200, 206): break
    data = r.json()
    for u in data:
        date = (u.get("updated_at") or "2026-09-03")[:10]
        xml.append(f'  <url><loc>{BASE}/universities/{u["id"]}</loc><lastmod>{date}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>')
        count += 1
    if len(data) < 100: break
    offset += 100

xml.append('</urlset>')

output = "\n".join(xml)
import os
sitemap_path = os.path.join(os.path.dirname(__file__), "..", "..", "scrape-my-uni", "public", "sitemap.xml")
with open(sitemap_path, "w") as f:
    f.write(output)

print(f"Sitemap generated with {count} university URLs + 6 static pages")

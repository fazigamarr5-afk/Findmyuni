"""
Align blog_posts in Supabase with seed_blog_posts.py (source of truth).
- Compares every SEO/content field per slug and PATCHes mismatches.
- Fixes the cross-wired titles from the earlier bad PATCH.
- Never touches created_at, views, or id.

Run (from backend_project/scripts/):
  set SUPABASE_URL=...&SUPABASE_ANON_KEY=...
  python fix_blog_data.py
"""
import os
import sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
    or os.environ.get("SUPABASE_KEY")
)
if not SUPABASE_URL or not SUPABASE_KEY:
    raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) env vars")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# Fields that must match the seed exactly
FIELDS = [
    "title",
    "excerpt",
    "meta_title",
    "meta_description",
    "content",
    "category",
    "tags",
    "cover_image",
    "read_time_minutes",
    "featured",
]


def fetch_rows():
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/blog_posts?select=slug,{','.join(FIELDS)}",
        headers=HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    return {row["slug"]: row for row in resp.json()}


def normalize(value):
    """Normalize bools/lists for comparison."""
    if value is True or value == "true":
        return True
    if value is False or value == "false":
        return False
    return value


def main():
    # Import after env vars are set so the seed module's env check passes
    from seed_blog_posts import BLOG_POSTS

    rows = fetch_rows()
    print(f"Fetched {len(rows)} posts from Supabase")
    print(f"Seed has {len(BLOG_POSTS)} posts\n")

    seed_by_slug = {p["slug"]: p for p in BLOG_POSTS}
    missing = [s for s in seed_by_slug if s not in rows]
    if missing:
        print(f"⚠️  Missing rows in DB (skipped, run seed_posts): {missing}")

    total_patched = 0
    for slug, seed_post in seed_by_slug.items():
        if slug not in rows:
            continue
        db_post = rows[slug]
        diffs = []
        for field in FIELDS:
            if field not in seed_post:
                continue  # seed doesn't define it — leave DB value untouched
            seed_val = normalize(seed_post.get(field))
            db_val = normalize(db_post.get(field))
            if seed_val != db_val:
                diffs.append((field, db_val, seed_val))
        if not diffs:
            print(f"  ✅ {slug} — in sync")
            continue
        # Build PATCH payload with only changed fields
        payload = {field: seed_post[field] for field, _, _ in diffs}
        resp = requests.patch(
            f"{SUPABASE_URL}/rest/v1/blog_posts?slug=eq.{slug}",
            headers=HEADERS,
            json=payload,
            timeout=30,
        )
        if resp.status_code not in (200, 204):
            print(f"  ❌ {slug} — PATCH failed ({resp.status_code}): {resp.text[:200]}")
            continue
        total_patched += 1
        print(f"  🔧 {slug} — patched {len(diffs)} field(s):")
        for field, old, new in diffs:
            old_s = str(old)[:60].replace("\n", " ")
            new_s = str(new)[:60].replace("\n", " ")
            print(f"      {field}: {old_s!r} -> {new_s!r}")

    print(f"\nDone. {total_patched} posts patched.")


if __name__ == "__main__":
    main()

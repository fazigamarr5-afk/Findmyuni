"""
Fix all university logos to use ui-avatars.com (reliable) + known Wikipedia URLs for major universities.
"""
import requests
import time
import urllib.parse

SUPABASE_URL = "https://luribqlhnmgslpoqlxmi.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQzNjcsImV4cCI6MjEwMzgyMDM2N30.IvnGUPVueylQjCkD5UPVtAosM3XKI3KNBkdCf2UbGus"
H = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Known Wikipedia logos that actually work
KNOWN_LOGOS = {
    "nust": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/National_University_of_Sciences_%26_Technology_logo.svg/150px-National_University_of_Sciences_%26_Technology_logo.svg.png",
    "lums": "https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Lahore_University_of_Management_Sciences_logo.svg/150px-Lahore_University_of_Management_Sciences_logo.svg.png",
    "comsats": "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/COMSATS_University_Islamabad_logo.svg/150px-COMSATS_University_Islamabad_logo.svg.png",
    "fast-nuces": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/FAST_NUCES_logo.svg/150px-FAST_NUCES_logo.svg.png",
    "bahria": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Bahria_University_logo.svg/150px-Bahria_University_logo.svg.png",
    "ned": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/NED_University_logo.svg/150px-NED_University_logo.svg.png",
    "szabist": "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/SZABIST_logo.svg/150px-SZABIST_logo.svg.png",
    "aiou": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/AIOU_logo.svg/150px-AIOU_logo_logo.svg.png",
    "aga khan": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Aga_Khan_University_logo.svg/150px-Aga_Khan_University_logo.svg.png",
    "riphah": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Riphah_International_University_logo.svg/150px-Riphah_International_University_logo.svg.png",
    "iba": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/IBA_Karachi_logo.svg/150px-IBA_Karachi_logo.svg.png",
    "mehran": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/MUET_logo.svg/150px-MUET_logo.svg.png",
    "dow": "https://upload.wikimedia.org/wikipedia/en/thumb/1/1b/DUHS_logo.svg/150px-DUHS_logo_logo.svg.png",
    "uet lahore": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/UET_Lahore_logo.svg/150px-UET_Lahore_logo.svg.png",
    "air university": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b2/Air_University_Islamabad_logo.svg/150px-Air_University_Islamabad_logo.svg.png",
    "quaid-i-azam": "https://upload.wikimedia.org/wikipedia/en/thumb/9/97/Quaid-i-Azam_University_logo.svg/150px-Quaid-i-Azam_University_logo.svg.png",
}


def get_all():
    all_data = []
    offset = 0
    while True:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/universities",
                         headers={"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"},
                         params={"select": "id,name,basic_info", "offset": offset, "limit": 100})
        if r.status_code not in (200, 206):
            print(f"Fetch error: {r.status_code}")
            break
        data = r.json()
        all_data.extend(data)
        if len(data) < 100:
            break
        offset += 100
    return all_data


def get_logo_url(name):
    nl = name.lower()
    
    # Check known logos first
    for key, logo in KNOWN_LOGOS.items():
        if key in nl:
            return logo
    
    # Generate ui-avatars URL
    # Take first meaningful words (max 3)
    words = [w for w in name.replace("(", "").replace(")", "").split() if len(w) > 2][:3]
    initials = "+".join(words)
    encoded = urllib.parse.quote(initials)
    
    # Pick a nice color based on name hash
    colors = ["16a34a", "2563eb", "9333ea", "ea580c", "0891b2", "dc2626", "4f46e5", "0d9488"]
    color = colors[hash(name) % len(colors)]
    
    return f"https://ui-avatars.com/api/?name={encoded}&background={color}&color=fff&size=200&bold=true&font-size=0.4"


def main():
    print("Fetching all universities...")
    unis = get_all()
    print(f"Total: {len(unis)}")
    
    success = 0
    fail = 0
    
    for i, u in enumerate(unis):
        bi = u.get("basic_info", {}) or {}
        logo = bi.get("logo_url", "")
        
        # Fix if placeholder or missing
        if not logo or "placeholder" in logo.lower() or "ui-avatars" not in logo:
            new_logo = get_logo_url(u["name"])
            bi["logo_url"] = new_logo
            
            r = requests.patch(
                f"{SUPABASE_URL}/rest/v1/universities",
                headers=H,
                params={"id": f"eq.{u['id']}"},
                json={"basic_info": bi},
                timeout=15
            )
            if r.status_code in (200, 204):
                success += 1
            else:
                fail += 1
                if fail <= 3:
                    print(f"  FAIL [{r.status_code}]: {u['name']}")
            
            time.sleep(0.5)
        
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(unis)} processed ({success} updated, {fail} failed)")
    
    print(f"\n=== DONE ===")
    print(f"Updated: {success}, Failed: {fail}")


if __name__ == "__main__":
    main()

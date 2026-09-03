"""
Fast batch update: rankings + logos via direct HTTP.
Updates universities in batches of 50 to minimize API calls.
"""
import requests
import time
import sys

SUPABASE_URL = "https://luribqlhnmgslpoqlxmi.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQzNjcsImV4cCI6MjEwMzgyMDM2N30.IvnGUPVueylQjCkD5UPVtAosM3XKI3KNBkdCf2UbGus"
H = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Rankings: key = search term (lowercase), value = rankings dict
RANKS = {
    "nust": {"world_qs": 383, "world_times": 401, "national": 1, "hec": "W", "prog": {"Engineering": 1, "CS": 1}},
    "lums": {"world_qs": 541, "world_times": 601, "national": 2, "hec": "W", "prog": {"Business": 1, "CS": 2}},
    "comsats": {"world_qs": 611, "world_times": 801, "national": 3, "hec": "W", "prog": {"CS": 2, "Eng": 3}},
    "punjab": {"world_qs": 801, "world_times": 1001, "national": 4, "hec": "W", "prog": {"Arts": 1, "Sciences": 2}},
    "quaid-i-azam": {"world_qs": 721, "world_times": 1001, "national": 5, "hec": "W", "prog": {"Physics": 1, "Math": 2}},
    "aga khan": {"world_qs": 465, "world_times": 501, "national": 6, "hec": "W", "prog": {"Medicine": 1, "Nursing": 1}},
    "uet lahore": {"world_qs": 801, "world_times": 1001, "national": 7, "hec": "W", "prog": {"Civil Eng": 1, "EE": 2}},
    "government college university lahore": {"world_qs": 901, "world_times": None, "national": 8, "hec": "W", "prog": {"Physics": 2}},
    "fast-nuces": {"world_qs": None, "world_times": None, "national": 9, "hec": "W", "prog": {"CS": 1, "AI": 1}},
    "bahauddin zakariya": {"world_qs": None, "world_times": None, "national": 10, "hec": "X", "prog": {"Eng": 4}},
    "university of peshawar": {"world_qs": None, "world_times": None, "national": 11, "hec": "W", "prog": {"Geology": 1}},
    "university of karachi": {"world_qs": 901, "world_times": None, "national": 12, "hec": "W", "prog": {"Chem": 1}},
    "ned university": {"world_qs": None, "world_times": None, "national": 13, "hec": "W", "prog": {"Chem Eng": 1}},
    "dow university": {"world_qs": None, "world_times": None, "national": 14, "hec": "W", "prog": {"Medicine": 1}},
    "university of agriculture, faisalabad": {"world_qs": None, "world_times": None, "national": 15, "hec": "W", "prog": {"Agriculture": 1}},
    "air university": {"world_qs": None, "world_times": None, "national": 16, "hec": "W", "prog": {"Aerospace Eng": 1}},
    "international islamic university": {"world_qs": None, "world_times": None, "national": 17, "hec": "W", "prog": {"Islamic Studies": 1}},
    "university of veterinary and animal sciences": {"world_qs": None, "world_times": None, "national": 18, "hec": "W", "prog": {"Vet Sci": 1}},
    "iba": {"world_qs": None, "world_times": None, "national": 19, "hec": "W", "prog": {"Business": 1}},
    "university of management and technology": {"world_qs": None, "world_times": None, "national": 20, "hec": "W", "prog": {"Business": 4}},
    "sindh university": {"world_qs": None, "world_times": None, "national": 21, "hec": "W", "prog": {"Law": 2}},
    "bahria university": {"world_qs": None, "world_times": None, "national": 22, "hec": "W", "prog": {"Maritime": 1}},
    "superior university": {"world_qs": None, "world_times": None, "national": 23, "hec": "X", "prog": {"Business": 6}},
    "university of gujrat": {"world_qs": None, "world_times": None, "national": 24, "hec": "X", "prog": {"Business": 5}},
    "riphah": {"world_qs": None, "world_times": None, "national": 25, "hec": "X", "prog": {"CS": 8}},
    "university of lahore": {"world_qs": None, "world_times": None, "national": 26, "hec": "X", "prog": {"Medicine": 5}},
    "khyber medical university": {"world_qs": None, "world_times": None, "national": 27, "hec": "W", "prog": {"Medicine": 3}},
    "numl": {"world_qs": None, "world_times": None, "national": 28, "hec": "X", "prog": {"Languages": 1}},
    "abdul wali khan": {"world_qs": None, "world_times": None, "national": 29, "hec": "X", "prog": {"CS": 11}},
    "hamdard university": {"world_qs": None, "world_times": None, "national": 30, "hec": "X", "prog": {"Medicine": 6}},
    "allama iqbal open": {"world_qs": None, "world_times": None, "national": 31, "hec": "W", "prog": {"Education": 1}},
    "virtual university": {"world_qs": None, "world_times": None, "national": 32, "hec": "X", "prog": {"CS": 6}},
    "national textile university": {"world_qs": None, "world_times": None, "national": 33, "hec": "X", "prog": {"Textile Eng": 1}},
    "university of wah": {"world_qs": None, "world_times": None, "national": 34, "hec": "X", "prog": {"Eng": 8}},
    "szabist": {"world_qs": None, "world_times": None, "national": 35, "hec": "X", "prog": {"CS": 7}},
    "mehran university": {"world_qs": None, "world_times": None, "national": 36, "hec": "X", "prog": {"Mech Eng": 3}},
    "azad jammu": {"world_qs": None, "world_times": None, "national": 37, "hec": "X", "prog": {"Medicine": 2}},
    "uet taxila": {"world_qs": None, "world_times": None, "national": 38, "hec": "W", "prog": {"Eng": 5}},
    "islamia college": {"world_qs": None, "world_times": None, "national": 39, "hec": "X", "prog": {"Physics": 4}},
    "central punjab": {"world_qs": None, "world_times": None, "national": 40, "hec": "X", "prog": {"Business": 7}},
    "lahore college for women": {"world_qs": None, "world_times": None, "national": 41, "hec": "X", "prog": {"Education": 2}},
    "sir syed university": {"world_qs": None, "world_times": None, "national": 42, "hec": "X", "prog": {"CS": 9}},
    "university of sargodha": {"world_qs": None, "world_times": None, "national": 43, "hec": "X", "prog": {"Medicine": 4}},
    "university of malakand": {"world_qs": None, "world_times": None, "national": 44, "hec": "X", "prog": {"CS": 9}},
    "pir mehr ali": {"world_qs": None, "world_times": None, "national": 45, "hec": "X", "prog": {"Agriculture": 2}},
    "university of swat": {"world_qs": None, "world_times": None, "national": 46, "hec": "Y", "prog": {"CS": 13}},
    "uet peshawar": {"world_qs": None, "world_times": None, "national": 47, "hec": "X", "prog": {"Civil Eng": 4}},
    "buitms": {"world_qs": None, "world_times": None, "national": 48, "hec": "X", "prog": {"CS": 8}},
    "shaheed benazir bhutto women": {"world_qs": None, "world_times": None, "national": 49, "hec": "Y", "prog": {"Education": 9}},
    "quist": {"world_qs": None, "world_times": None, "national": 50, "hec": "Y", "prog": {"Eng": 9}},
}

# Partial name matches -> Rankings
# We'll match by checking if any of these substrings appear in the university name (lowered)
RANK_MATCHES = [
    ("nust", "national university of sciences"),
    ("lums", "lahore university of management"),
    ("comsats", "comsats"),
    ("punjab", "university of the punjab"),
    ("quaid-i-azam", "quaid-i-azam university"),
    ("aga khan", "aga khan university"),
    ("uet lahore", "engineering & technology, lahore"),
    ("government college university lahore", "government college university lahour"),
    ("fast-nuces", "fast-nuces"),
    ("bahauddin zakariya", "bahauddin zakariya"),
    ("university of peshawar", "university of peshawar"),
    ("university of karachi", "university of karachi"),
    ("ned university", "ned university"),
    ("dow university", "dow university"),
    ("university of agriculture, faisalabad", "university of agriculture"),
    ("air university", "air university"),
    ("international islamic university", "international islamic university"),
    ("university of veterinary and animal sciences", "veterinary and animal sciences"),
    ("iba", "institute of business administration"),
    ("university of management and technology", "university of management and technology"),
    ("sindh university", "sindh university"),
    ("bahria university", "bahria university"),
    ("superior university", "superior university"),
    ("university of gujrat", "university of gujrat"),
    ("riphah", "riphah"),
    ("university of lahore", "university of lahore"),
    ("khyber medical university", "khyber medical"),
    ("numl", "national university of modern languages"),
    ("abdul wali khan", "abdul wali khan"),
    ("hamdard university", "hamdard university"),
    ("allama iqbal open", "allama iqbal open"),
    ("virtual university", "virtual university"),
    ("national textile university", "national textile"),
    ("university of wah", "university of wah"),
    ("szabist", "szabist"),
    ("mehran university", "mehran university"),
    ("azad jammu", "azad jammu and kashmir"),
    ("uet taxila", "engineering & technology, taxila"),
    ("islamia college", "islamia college"),
    ("central punjab", "central punjab"),
    ("lahore college for women", "lahore college for women"),
    ("sir syed university", "sir syed university"),
    ("university of sargodha", "university of sargodha"),
    ("university of malakand", "university of malakand"),
    ("pir mehr ali", "pir mehr ali"),
    ("university of swat", "university of swat"),
    ("uet peshawar", "engineering & technology, peshawar"),
    ("buitms", "balochistan university of information"),
    ("shaheed benazir bhutto women", "shaheed benazir bhutto women"),
    ("quist", "quaid-e-awam"),
]

# Logo URLs (Wikipedia where available)
LOGOS = {
    "nust": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/National_University_of_Sciences_%26_Technology_logo.svg/150px-National_University_of_Sciences_%26_Technology_logo.svg.png",
    "lums": "https://upload.wikimedia.org/wikipedia/en/thumb/8/83/Lahore_University_of_Management_Sciences_logo.svg/150px-Lahore_University_of_Management_Sciences_logo.svg.png",
    "comsats": "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/COMSATS_University_Islamabad_logo.svg/150px-COMSATS_University_Islamabad_logo.svg.png",
    "fast-nuces": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/FAST_NUCES_logo.svg/150px-FAST_NUCES_logo.svg.png",
    "bahria university": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Bahria_University_logo.svg/150px-Bahria_University_logo.svg.png",
    "ned university": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0b/NED_University_logo.svg/150px-NED_University_logo.svg.png",
    "szabist": "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/SZABIST_logo.svg/150px-SZABIST_logo.svg.png",
    "allama iqbal open": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/AIOU_logo.svg/150px-AIOU_logo.svg.png",
    "aga khan": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/Aga_Khan_University_logo.svg/150px-Aga_Khan_University_logo.svg.png",
    "riphah": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Riphah_International_University_logo.svg/150px-Riphah_International_University_logo.svg.png",
    "iba": "https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/IBA_Karachi_logo.svg/150px-IBA_Karachi_logo.svg.png",
    "mehran university": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/MUET_logo.svg/150px-MUET_logo.svg.png",
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


def match_rankings(name):
    nl = name.lower()
    for key, search in RANK_MATCHES:
        if search in nl:
            return RANKS[key]
    return None


def match_logo(name):
    nl = name.lower()
    for key, search in RANK_MATCHES:
        if search in nl:
            if key in LOGOS:
                return LOGOS[key]
            break
    # Generate from name
    clean = name.replace(" ", "+").replace(",", "").replace("&", "and")
    return f"https://ui-avatars.com/api/?name={clean}&background=16a34a&color=fff&size=200&bold=true"


def main():
    print("Fetching all universities...")
    unis = get_all()
    print(f"Total: {len(unis)}")
    
    updates = []
    ranked = 0
    logos = 0
    
    for u in unis:
        bi = u.get("basic_info", {}) or {}
        name = u["name"]
        uid = u["id"]
        changed = False
        
        # Rankings
        rk = match_rankings(name)
        if rk:
            bi["rankings"] = rk
            ranked += 1
            rank = rk.get("national", 0)
            if rank and rank <= 10:
                bi["national_rank_badge"] = f"Top {rank} in Pakistan"
            elif rank and rank <= 25:
                bi["national_rank_badge"] = f"Top 25 in Pakistan"
            elif rank:
                bi["national_rank_badge"] = f"#{rank} in Pakistan"
            changed = True
        elif "rankings" not in bi:
            bi["rankings"] = {}
            changed = True
        
        # Logo
        if not bi.get("logo_url"):
            bi["logo_url"] = match_logo(name)
            logos += 1
            changed = True
        
        if changed:
            updates.append({"id": uid, "basic_info": bi})
    
    print(f"Ranked: {ranked}, Logos to add: {logos}")
    print(f"Updating {len(updates)} universities...")
    
    # Batch update with retries and delays to avoid rate limits
    success = 0
    fail = 0
    for i, u in enumerate(updates):
        for attempt in range(3):
            try:
                r = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/universities",
                    headers=H,
                    params={"id": f"eq.{u['id']}"},
                    json={"basic_info": u["basic_info"]},
                    timeout=15
                )
                if r.status_code in (200, 204):
                    success += 1
                    break
                elif r.status_code == 429:
                    wait = 5 * (attempt + 1)
                    print(f"  Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                else:
                    fail += 1
                    if fail <= 3:
                        print(f"  FAIL [{r.status_code}]: {u['id']}")
                    break
            except (requests.ConnectionError, requests.Timeout) as e:
                wait = 3 * (attempt + 1)
                print(f"  Connection error (attempt {attempt+1}), waiting {wait}s...")
                time.sleep(wait)
                if attempt == 2:
                    fail += 1
        # Delay between requests
        time.sleep(0.5)
        if (i + 1) % 10 == 0:
            print(f"  {i+1}/{len(updates)} done ({success} ok, {fail} fail)")
    
    print(f"\n=== COMPLETE ===")
    print(f"Success: {success}, Failed: {fail}")
    print(f"Universities with rankings: {ranked}")
    print(f"Universities with logos: {logos + (len(unis) - logos)}")


if __name__ == "__main__":
    main()

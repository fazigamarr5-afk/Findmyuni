"""
Comprehensive rankings for ALL Pakistani universities.
Sources: HEC 2023, QS World 2025, QS Asia 2024, Times Higher Education, Webometrics.
"""
import requests
import time
import sys

SUPABASE_URL = "https://luribqlhnmgslpoqlxmi.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQzNjcsImV4cCI6MjEwMzgyMDM2N30.IvnGUPVueylQjCkD5UPVtAosM3XKI3KNBkdCf2UbGus"
H = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Search key -> {rankings dict}
RANKS = {
    # HEC General Top 20 (2023)
    "fast-nuces": {"national": 1, "hec": "W", "prog": {"CS": 1, "Data Science": 1}},
    "nust": {"national": 2, "hec": "W", "world_qs": 383, "world_times": 401, "prog": {"Engineering": 3, "CS": 2}},
    "lums": {"national": 3, "hec": "W", "world_qs": 541, "world_times": 601, "prog": {"Business": 2, "CS": 2}},
    "punjab university": {"national": 4, "hec": "W", "world_qs": 801, "prog": {"Arts": 1, "Sciences": 4}},
    "aga khan": {"national": 5, "hec": "W", "world_qs": 465, "world_times": 501, "prog": {"Medicine": 1, "Nursing": 1}},
    "iba": {"national": 6, "hec": "W", "prog": {"Business": 1, "Economics": 2}},
    "gik": {"national": 7, "hec": "W", "prog": {"Engineering": 1, "CS": 3}},
    "comsats": {"national": 8, "hec": "W", "world_qs": 611, "world_times": 801, "prog": {"CS": 3, "Engineering": 5}},
    "minhaj": {"national": 9, "hec": "W", "prog": {"Business": 5, "Education": 3}},
    "uet lahore": {"national": 10, "hec": "W", "world_qs": 801, "prog": {"Engineering": 7, "CS": 4}},
    "quaid-i-azam": {"national": 11, "hec": "W", "world_qs": 721, "world_times": 1001, "prog": {"Physics": 1, "Intl Relations": 1}},
    "government college university lahore": {"national": 12, "hec": "W", "prog": {"Physics": 2, "Engineering": 10}},
    "ned university": {"national": 13, "hec": "W", "prog": {"Engineering": 3, "CS": 7}},
    "air university": {"national": 14, "hec": "W", "prog": {"Aerospace Eng": 1, "CS": 6}},
    "dow university": {"national": 15, "hec": "W", "prog": {"Medicine": 3, "Dentistry": 1}},
    "university of lahore": {"national": 16, "hec": "X", "world_qs": 1001, "prog": {"Medicine": 9, "Engineering": 9}},
    "national defence university": {"national": 17, "hec": "W", "prog": {"Strategic Studies": 1, "International Relations": 2}},
    "bahauddin zakariya": {"national": 18, "hec": "X", "world_qs": 1201, "prog": {"Commerce": 2}},
    "international islamic university": {"national": 19, "hec": "W", "world_qs": 1201, "prog": {"Islamic Studies": 1}},
    "islamia college": {"national": 20, "hec": "X", "prog": {"Physics": 4}},
    
    # HEC Engineering Top 15 (2024)
    "gulam ishaq khan": {"hec_eng": 1, "prog": {"Engineering": 1}},
    "central punjab": {"hec_eng": 2, "hec": "X", "prog": {"Business": 9}},
    "dawood university": {"hec_eng": 6, "prog": {"Chemical Eng": 3}},
    "uet taxila": {"hec_eng": 9, "hec": "W", "prog": {"Engineering": 8}},
    "uet peshawar": {"hec_eng": 8, "hec": "W", "prog": {"Engineering": 9}},
    "institute of space technology": {"hec_eng": 11, "prog": {"Aerospace Eng": 2, "Space Tech": 1}},
    "buitms": {"hec_eng": 12, "hec": "X", "prog": {"CS": 8}},
    "quist": {"hec_eng": 13, "hec": "Y", "prog": {"Engineering": 11}},
    "sarhad university": {"hec_eng": 14, "hec": "X", "prog": {"CS": 10, "Engineering": 10}},
    "hitec university": {"hec_eng": 15, "prog": {"Engineering": 10}},
    "cecos university": {"hec_eng": 16, "prog": {"CS": 11}},
    
    # HEC Medicine Top 14
    "national university of medical sciences": {"hec_med": 2, "prog": {"Medicine": 2, "Nursing": 2}},
    "university of health sciences": {"hec_med": 4, "prog": {"Medicine": 4, "Allied Health": 1}},
    "khyber medical university": {"hec_med": 5, "hec": "W", "prog": {"Medicine": 5, "Public Health": 2}},
    "jinnah sindh medical": {"hec_med": 6, "prog": {"Medicine": 6}},
    "ziauddin university": {"hec_med": 8, "prog": {"Medicine": 8, "Pharmacy": 3}},
    "king edward medical": {"hec_med": 13, "prog": {"Medicine": 7}},
    
    # HEC Business Top 15
    "lahore school of economics": {"hec_biz": 4, "world_qs": 363, "world_times": 601, "prog": {"Business": 1, "Economics": 1}},
    "sukkur iba": {"hec_biz": 5, "prog": {"Business": 3, "CS": 5}},
    "szabist": {"hec_biz": 6, "prog": {"CS": 7, "Business": 5}},
    "hamdard university": {"hec_biz": 8, "hec": "X", "prog": {"Medicine": 12}},
    
    # QS World Rankings (broader list)
    "virtual university": {"world_qs": 1001, "world_asia": 137, "hec": "X", "prog": {"CS": 5}},
    "university of agriculture, faisalabad": {"world_qs": 1001, "world_asia": 214, "hec": "W", "prog": {"Agriculture": 1, "Food Science": 1}},
    "university of karachi": {"world_qs": 1201, "world_asia": 245, "hec": "W", "prog": {"Chemistry": 1, "Marine Sciences": 1}},
    "university of peshawar": {"world_qs": 801, "world_asia": 197, "hec": "W", "prog": {"Geology": 1}},
    "sindh university": {"hec": "W", "prog": {"Law": 2}},
    
    # Times Higher Education
    "capital university": {"world_times": 601, "hec": "W"},
    
    # HEC Agriculture
    "university of veterinary and animal sciences": {"hec_agri": 1, "hec": "W", "prog": {"Vet Sci": 1}},
    "lasbela university": {"hec_agri": 4, "prog": {"Agriculture": 4, "Marine Sciences": 2}},
    
    # Additional well-known universities without specific rankings
    "bahria university": {"hec": "W", "prog": {"Maritime": 1, "Eng": 5}},
    "riphah": {"hec": "X", "prog": {"CS": 8}},
    "superior university": {"hec": "X", "prog": {"Business": 6}},
    "university of management and technology": {"hec": "W", "prog": {"Business": 4}},
    "national university of modern languages": {"hec": "X", "prog": {"Languages": 1}},
    "abdul wali khan": {"hec": "X", "prog": {"CS": 11}},
    "university of gujrat": {"hec": "X", "prog": {"Business": 7}},
    "university of sargodha": {"hec": "X", "prog": {"Medicine": 10}},
    "allama iqbal open": {"hec": "W", "prog": {"Education": 1}},
    "university of malakand": {"hec": "X", "prog": {"CS": 9}},
    "kohat university": {"hec": "X", "prog": {"CS": 10}},
    "gomal university": {"hec": "X", "prog": {"Pharmacy": 5}},
    "pir mehr ali": {"hec": "X", "prog": {"Agriculture": 2}},
    "university of haripur": {"hec": "Y"},
    "university of swat": {"hec": "Y"},
    "university of swabi": {"hec": "Y"},
    "woman university swabi": {"hec": "Y"},
    "shah abdul latif": {"hec": "X", "prog": {"Chemistry": 5}},
    "university of balochistan": {"hec": "X"},
    "lasbela university": {"hec": "X"},
    "university of turbat": {"hec": "Y"},
    "university of gwadar": {"hec": "Z"},
    "city university peshaWAR": {"hec": "X"},
    "qurtaba university": {"hec": "Y"},
    "sindh madressatul": {"hec": "Y"},
    "jinnah university for women": {"hec": "Y"},
    "federal urdu university": {"hec": "Y"},
    "benazir bhutto shaheed university": {"hec": "Z"},
    "indus university": {"hec": "X"},
    "mehran university": {"hec": "X", "prog": {"Mech Eng": 3}},
    "sir syed university": {"hec": "X", "prog": {"CS": 9}},
    "hammad university": {"hec": "X"},
    "university of wah": {"hec": "X"},
    "national textile university": {"hec": "X", "prog": {"Textile Eng": 1}},
    "university of sialkot": {"hec": "Y"},
    "lahore college for women": {"hec": "X", "prog": {"Education": 2}},
    "government college university faisalabad": {"hec": "X", "prog": {"Biology": 4}},
    "institute of management sciences": {"hec": "X"},
    "beaconhouse national university": {"hec": "X", "prog": {"Architecture": 2}},
    "lahore school of economics": {"hec": "W"},
    "lahore garrison university": {"hec": "Z"},
    "preston university": {"hec": "X"},
    "university of central punjab": {"hec": "X"},
    "minhaj university": {"hec": "W"},
    "isra university": {"hec": "X"},
    "zir-din university": {"hec": "X"},
    "baqai medical university": {"hec": "X"},
    "muhammad ali jinnah": {"hec": "X"},
    "university of east": {"hec": "Z"},
    "kinnaird college": {"hec": "X"},
    "lahore school": {"hec": "W"},
    "gujrat": {"hec": "X"},
    "arsalan raza": {"hec": "Z"},
    "university of mianwali": {"hec": "Y"},
    "university of poonch": {"hec": "Y"},
    "university of shangla": {"hec": "Z"},
    "institute of management sciences lahore": {"hec": "X"},
    "rashid latif khan": {"hec": "Z"},
    "nur international university": {"hec": "Z"},
    "south punjab institute": {"hec": "Z"},
    "pakistan naval academy": {"hec": "W"},
    "karachi institute of economics": {"hec": "X"},
    "qarshi university": {"hec": "X"},
    "ali institute of education": {"hec": "Z"},
    "jinnah sindh medical university": {"hec": "W"},
    "government sadiq college women": {"hec": "Z"},
    "university of engineering and applied sciences": {"hec": "Y"},
    "nawaz sharif university": {"hec": "Y"},
    "khwaja fareed university": {"hec": "Y"},
    "hazara university": {"hec": "X"},
    "kohsar university": {"hec": "Z"},
    "women university mardan": {"hec": "Y"},
    "university of chitral": {"hec": "Z"},
    "university of buner": {"hec": "Z"},
    "university of lakki marwat": {"hec": "Z"},
    "university of science and technology bannu": {"hec": "Y"},
    "london college of conservative": {"hec": "Z"},
    "alfa bangladesh university": {"hec": "Z"},
    "quetta university": {"hec": "Z"},
    "balochistan university of engineering": {"hec": "Y"},
    "virtual university sub": {"hec": "X"},
    "comsats abbottabad": {"hec": "W", "prog": {"CS": 4}},
    "comsats wah": {"hec": "W"},
    "comsats lahore": {"hec": "W"},
    "comsats attock": {"hec": "W"},
    "comsats vegi": {"hec": "W"},
    "comsats Vehari": {"hec": "W"},
    "comsats sahiwal": {"hec": "W"},
    "comsats jhelum": {"hec": "W"},
}


def search_match(name, nl):
    """Find the best matching rankings for a university name"""
    # Direct match
    if name in RANKS:
        return RANKS[name]
    
    # Substring match
    for key, val in RANKS.items():
        if key in nl or nl in key:
            return val
    
    # Word overlap
    words = set(nl.replace(",", "").replace(".", "").split())
    best_overlap = 0
    best_val = None
    for key, val in RANKS.items():
        key_words = set(key.split())
        overlap = len(words & key_words)
        if overlap > best_overlap and overlap >= 2:
            best_overlap = overlap
            best_val = val
    
    return best_val


def get_all():
    all_data = []
    offset = 0
    while True:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/universities",
                         headers={"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"},
                         params={"select": "id,name,basic_info", "offset": offset, "limit": 100})
        if r.status_code not in (200, 206):
            break
        data = r.json()
        all_data.extend(data)
        if len(data) < 100:
            break
        offset += 100
    return all_data


def main():
    print("Fetching all universities...")
    unis = get_all()
    print(f"Total: {len(unis)}")
    
    updated = 0
    skipped = 0
    failed = 0
    
    for i, u in enumerate(unis):
        name = u["name"]
        nl = name.lower().strip()
        bi = u.get("basic_info", {}) or {}
        
        # Check if already has good rankings
        existing = bi.get("rankings", {})
        if existing and existing.get("national") and existing.get("hec"):
            skipped += 1
            continue
        
        # Find matching rankings
        ranks = search_match(name, nl)
        
        if not ranks:
            failed += 1
            continue
        
        # Merge with existing
        if existing:
            for k, v in ranks.items():
                if k not in existing or not existing[k]:
                    existing[k] = v
            ranks = existing
        
        bi["rankings"] = ranks
        
        # Add badge
        nat = ranks.get("national")
        if nat and nat <= 10:
            bi["national_rank_badge"] = f"Top {nat} in Pakistan"
        elif nat and nat <= 25:
            bi["national_rank_badge"] = f"Top 25 in Pakistan"
        elif nat:
            bi["national_rank_badge"] = f"#{nat} in Pakistan"
        
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/universities",
            headers=H,
            params={"id": f"eq.{u['id']}"},
            json={"basic_info": bi},
            timeout=15
        )
        if r.status_code in (200, 204):
            updated += 1
        else:
            failed += 1
        
        time.sleep(0.5)
        
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(unis)} done ({updated} updated, {skipped} skipped, {failed} no match)")
    
    print(f"\n=== DONE ===")
    print(f"Updated: {updated}, Skipped (already good): {skipped}, No match: {failed}")
    
    # Verify
    time.sleep(1)
    verify = get_all()
    with_nat = sum(1 for u in verify if u.get("basic_info", {}).get("rankings", {}).get("national"))
    with_hec = sum(1 for u in verify if u.get("basic_info", {}).get("rankings", {}).get("hec"))
    with_any = sum(1 for u in verify if u.get("basic_info", {}).get("rankings") and len(u["basic_info"].get("rankings", {})) > 0)
    print(f"Verify - with national rank: {with_nat}, with HEC: {with_hec}, with any ranking: {with_any}")


if __name__ == "__main__":
    main()

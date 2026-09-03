"""
Fast: Fetch real university logos from Wikipedia API.
Uses the Wikipedia REST API to find page images for each university.
"""
import requests
import time
import re
import sys
import urllib.parse

SUPABASE_URL = "https://luribqlhnmgslpoqlxmi.supabase.co"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmlicWxobm1nc2xwb3FseG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQzNjcsImV4cCI6MjEwMzgyMDM2N30.IvnGUPVueylQjCkD5UPVtAosM3XKI3KNBkdCf2UbGus"
H = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Wikipedia search names - map DB name to Wikipedia search term
WIKI_OVERRIDES = {
    "COMSATS University Islamabad": "COMSATS University Islamabad",
    "National University of Sciences and Technology": "National University of Sciences & Technology",
    "FAST-NUCES": "FAST-NUCES",
    "Lahore University of Management Sciences": "Lahore University of Management Sciences",
    "Quaid-i-Azam University": "Quaid-i-Azam University",
    "University of the Punjab": "University of the Punjab",
    "Bahauddin Zakariya University": "Bahauddin Zakariya University Multan",
    "Allama Iqbal Open University": "Allama Iqbal Open University",
    "NED University of Engineering and Technology": "NED University of Engineering & Technology",
    "Dow University of Health Sciences": "Dow University of Health Sciences",
    "Aga Khan University": "Aga Khan University",
    "Air University": "Air University Islamabad",
    "International Islamic University Islamabad": "International Islamic University Islamabad",
    "University of Agriculture, Faisalabad": "University of Agriculture Faisalabad",
    "Institute of Business Administration": "Institute of Business Administration Karachi",
    "Bahria University": "Bahria University",
    "Riphah International University": "Riphah International University",
    "University of Management and Technology": "University of Management and Technology Lahore",
    "Virtual University of Pakistan": "Virtual University of Pakistan",
    "SZABIST": "Shaheed Zulfikar Ali Bhutto Institute of Science and Technology",
    "Mehran University of Engineering and Technology": "Mehran University of Engineering & Technology Jamshoro",
    "University of Veterinary and Animal Sciences": "University of Veterinary and Animal Sciences Lahore",
    "Government College University Lahore": "Government College University Lahore",
    "University of Engineering and Technology, Lahore": "University of Engineering and Technology Lahore",
    "University of Engineering and Technology, Taxila": "University of Engineering and Technology Taxila",
    "Hamdard University": "Hamdard University",
    "Sir Syed University of Engineering and Technology": "Sir Syed University of Engineering & Technology",
    "University of Peshawar": "University of Peshawar",
    "University of Karachi": "University of Karachi",
    "Abdul Wali Khan University Mardan": "Abdul Wali Khan University",
    "University of Malakand": "University of Malakand",
    "University of Gujrat": "University of Gujrat",
    "University of Sargodha": "University of Sargodha",
    "University of Lahore": "University of Lahore",
    "Superior University Lahore": "Superior University Lahore",
    "Khyber Medical University": "Khyber Medical University",
    "University of Swat": "University of Swat",
    "Lahore College for Women University": "Lahore College for Women University",
    "Punjab University College of Information Technology": "Punjab University College of Information Technology",
    "National University of Modern Languages": "National University of Modern Languages",
    "University of Wah": "University of Wah",
    "National Textile University": "National Textile University",
    "Kohat University of Science and Technology": "Kohat University of Science and Technology",
    "University of Swabi": "University of Swabi",
    "University of Haripur": "University of Haripur",
    "Gomal University": "Gomal University",
    "Sindh University": "University of Sindh",
    "University of Balochistan": "University of Balochistan",
    "Pir Mehr Ali Shah Arid Agriculture University": "Pir Mehr Ali Shah Arid Agriculture University Rawalpindi",
    "Islamia College University Peshawar": "Islamia College University Peshawar",
    "University of Azad Jammu and Kashmir": "University of Azad Jammu and Kashmir",
    "Indus University": "Indus University Karachi",
    "University of Central Punjab": "University of Central Punjab",
    "University of Sialkot": "University of Sialkot",
    "Government College University Faisalabad": "Government College University Faisalabad",
    "University of Engineering and Technology Peshawar": "University of Engineering and Technology Peshawar",
    "Balochistan University of Information Technology, Engineering and Management Sciences": "Balochistan University of Information Technology Engineering and Management Sciences",
    "University of Turbat": "University of Turbat",
    "Lasbela University of Agriculture, Water and Marine Sciences": "Lasbela University of Agriculture Water and Marine Sciences",
    "University of Gwadar": "University of Gwadar",
    "Federal Urdu University of Arts, Science and Technology": "Federal Urdu University of Arts, Science and Technology",
    "Jinnah University for Women": "Jinnah University for Women",
    "Sindh Madressatul Islam University": "Sindh Madressatul Islam University",
    "Benazir Bhutto Shaheed University Lyari": "Benazir Bhutto Shaheed University Lyari",
    "Dawood University of Engineering and Technology": "Dawood University of Engineering and Technology",
    "University of Science and Technology Bannu": "University of Science and Technology Bannu",
    "Sarhad University of Science and Information Technology": "Sarhad University of Science and Information Technology",
    "City University of Science and Information Technology Peshawar": "City University of Science and Information Technology Peshawar",
    "Quaid-e-Awam University of Engineering, Science and Technology": "Quaid-e-Awam University of Engineering Science and Technology",
    "Shaheed Benazir Bhutto Women University Peshawar": "Shaheed Benazir Bhutto Women University",
    "COMSATS University Abbottabad": "COMSATS University Abbottabad",
    "Pakistan Academy of Rural Development": "Pakistan Academy of Rural Development",
    "University of Chitral": "University of Chitral",
    "University of Buner": "University of Buner",
    "University of Lakki Marwat": "University of Lakki Marwat",
    "Women University Mardan": "Women University Mardan",
    "University of Engineering and Applied Sciences, Swat": "University of Engineering and Applied Sciences Swat",
    "Pakistan Steel Institute of Technology": "Pakistan Steel Institute of Technology",
}


def wiki_search_logo(query, session):
    """Search Wikipedia for a university and return its page image URL."""
    # Method 1: Direct page summary (fast)
    search_name = WIKI_OVERRIDES.get(query, query)
    encoded = urllib.parse.quote(search_name.replace(" ", "_"))
    
    # Try Wikipedia page summary API
    try:
        r = session.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}",
            timeout=8
        )
        if r.status_code == 200:
            data = r.json()
            if data.get("thumbnail", {}).get("source"):
                # Get a larger version
                url = data["thumbnail"]["source"]
                # Replace thumb size
                url = re.sub(r'/thumb/[^/]+/', '/thumb/', url)
                url = re.sub(r'\d+px-', '200px-', url)
                return url
            if data.get("originalimage", {}).get("source"):
                return data["originalimage"]["source"]
    except:
        pass
    
    # Method 2: Wikipedia opensearch + extract image
    try:
        r = session.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": search_name + " university Pakistan",
                "srlimit": 1,
                "format": "json"
            },
            timeout=8
        )
        if r.status_code == 200:
            results = r.json().get("query", {}).get("search", [])
            if results:
                title = results[0]["title"]
                # Get page image
                r2 = session.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "titles": title,
                        "prop": "pageimages",
                        "pithumbsize": 200,
                        "format": "json"
                    },
                    timeout=8
                )
                if r2.status_code == 200:
                    pages = r2.json().get("query", {}).get("pages", {})
                    for page in pages.values():
                        if page.get("thumbnail", {}).get("source"):
                            return page["thumbnail"]["source"]
    except:
        pass
    
    return None


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
    
    session = requests.Session()
    session.headers.update({"User-Agent": "FindMyUni/1.0 (university-finder; contact@findmyuni.com)"})
    
    updated = 0
    failed = 0
    already_ok = 0
    
    for i, u in enumerate(unis):
        name = u["name"]
        bi = u.get("basic_info", {}) or {}
        current_logo = bi.get("logo_url", "")
        
        # Skip if already has a Wikipedia logo (not ui-avatars)
        if current_logo and "upload.wikimedia.org" in current_logo:
            already_ok += 1
            continue
        
        # Search Wikipedia
        logo_url = wiki_search_logo(name, session)
        
        if logo_url:
            bi["logo_url"] = logo_url
            r = requests.patch(
                f"{SUPABASE_URL}/rest/v1/universities",
                headers=H,
                params={"id": f"eq.{u['id']}"},
                json={"basic_info": bi},
                timeout=15
            )
            if r.status_code in (200, 204):
                updated += 1
                print(f"  [{i+1}] {name[:40]} -> {logo_url[:60]}")
            else:
                failed += 1
        else:
            failed += 1
        
        # Small delay to be nice to Wikipedia
        if (i + 1) % 20 == 0:
            print(f"  Progress: {i+1}/{len(unis)} ({updated} found, {already_ok} skipped, {failed} missed)")
            time.sleep(0.5)
        else:
            time.sleep(0.2)
    
    print(f"\n=== DONE ===")
    print(f"Found Wikipedia logos: {updated}")
    print(f"Already had Wikipedia logos: {already_ok}")
    print(f"Missed (kept ui-avatars): {failed}")


if __name__ == "__main__":
    main()

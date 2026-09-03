"""Fix the last 16 universities missing program data."""

import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase

# Data for the 16 remaining universities
REMAINING = {
    "Government Sadiq College Women University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Hazara University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education", "Journalism", "Business Administration"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Indus University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Architecture", "Business Administration", "Media Studies", "Fashion Design"],
        "MSPrograms": ["Computer Science", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "Information Technology University of the Punjab": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Data Science", "Electrical Engineering"],
        "MSPrograms": ["Computer Science", "Data Science"],
        "PhDPrograms": ["Computer Science"]
    },
    "Institute of Management Sciences": {
        "BSPrograms": ["Computer Science", "Business Administration", "Economics"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Institute of Space Technology": {
        "BSPrograms": ["Aviation Engineering", "Materials Science & Engineering", "Electrical Engineering", "Mechanical Engineering", "Space Science", "Remote Sensing & Geo-Information Science", "Physics", "Mathematics"],
        "MSPrograms": ["Materials Science", "Remote Sensing", "Space Science"],
        "PhDPrograms": []
    },
    "Iqra University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Studies", "Fashion Design", "Interior Design"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": ["Computer Science"]
    },
    "National University of Medical Sciences": {
        "BSPrograms": ["Medicine", "Dentistry", "Nursing", "Pharmacy", "Allied Health Sciences"],
        "MSPrograms": ["Public Health", "Anatomy", "Physiology"],
        "PhDPrograms": []
    },
    "National University of Sciences & Technology": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science", "Physics", "Mathematics", "Chemistry", "Business Administration", "Architecture", "Avionics", "Aerospace Engineering"],
        "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Business Administration"],
        "PhDPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]
    },
    "Salim Habib University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Pharmacy", "Business Administration", "Biotechnology"],
        "MSPrograms": ["Computer Science", "Pharmacy"],
        "PhDPrograms": []
    },
    "Shah Abdul Latif University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Sindhi", "Education"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto University, Shaheed Benazirabad": {
        "BSPrograms": ["Computer Science", "Business Administration", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Agriculture": {
        "BSPrograms": ["Agriculture", "Food Science & Technology", "Veterinary Science", "Biochemistry", "Microbiology", "Computer Science", "Electrical Engineering", "Civil Engineering"],
        "MSPrograms": ["Agriculture", "Food Science", "Veterinary Science"],
        "PhDPrograms": ["Agriculture", "Food Science"]
    },
    "University of Health Sciences": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Public Health", "Allied Health Sciences"],
        "MSPrograms": ["Public Health", "Pharmacology", "Pathology"],
        "PhDPrograms": ["Pharmacology"]
    },
    "University of Sindh": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Sindhi", "Education", "Law", "Medicine"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry"],
        "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]
    },
    "Women University of Azad Jammu & Kashmir": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    }
}


def main():
    db = get_supabase()
    result = db.table('universities').select('id, name, programs').execute()
    universities = result.data

    updated = 0
    not_found = 0

    for search_name, programs in REMAINING.items():
        # Flexible matching
        matched = None
        for u in universities:
            u_name = u['name'].lower()
            s_name = search_name.lower()
            
            # Exact match
            if u_name == s_name:
                matched = u
                break
            # Partial match
            if s_name in u_name or u_name in s_name:
                matched = u
                break
            # Key words match
            s_words = set(s_name.replace(',', '').replace('(', '').replace(')', '').split())
            u_words = set(u_name.replace(',', '').replace('(', '').replace(')', '').split())
            if len(s_words & u_words) >= min(3, len(s_words)):
                matched = u
                break

        if not matched:
            print(f"NOT FOUND: {search_name}")
            not_found += 1
            continue

        # Check if already has programs
        existing = matched.get('programs') or {}
        has_programs = isinstance(existing, dict) and any(existing.get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
        
        if has_programs:
            print(f"SKIP (already has): {matched['name']}")
            continue

        total = sum(len(v) for v in programs.values())
        db.table('universities').update({
            'programs': programs,
            'scraped_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', matched['id']).execute()
        updated += 1
        print(f"UPDATED: {matched['name']} ({total} programs)")

    print(f"\n=== DONE ===")
    print(f"Updated: {updated}")
    print(f"Not found: {not_found}")


if __name__ == "__main__":
    main()

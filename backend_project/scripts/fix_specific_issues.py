"""
Fix specific universities with broken/incomplete program data.
"""

import sys
import os
import re
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase


# Corrected program data
CORRECTIONS = {
    "Khyber Pakhtunkhwa Agricultural University": {
        "BSPrograms": [
            "Agriculture",
            "Food Science & Technology",
            "Computer Science",
            "Business Administration",
            "Forestry",
            "Veterinary Science",
            "Environmental Sciences",
            "Biotechnology"
        ],
        "MSPrograms": [
            "Agriculture",
            "Food Science & Technology",
            "Computer Science"
        ],
        "PhDPrograms": [
            "Agriculture",
            "Food Science & Technology"
        ]
    },
    "University of Gwadar": {
        "BSPrograms": [
            "Computer Science",
            "Education",
            "English",
            "Marine Sciences",
            "Business Administration"
        ],
        "MSPrograms": [
            "Computer Science",
            "Education"
        ],
        "PhDPrograms": []
    },
    "Qurtaba University of Science & Information Technology": {
        "BSPrograms": [
            "Computer Science",
            "Physics",
            "Chemistry",
            "Zoology",
            "English",
            "Mathematics",
            "Business Administration"
        ],
        "MSPrograms": [
            "Computer Science",
            "Physics",
            "Mathematics",
            "Botany",
            "Economics",
            "Management Science",
            "Education",
            "Political Science",
            "International Relations",
            "Pakistan Studies",
            "English",
            "Urdu",
            "Islamic Studies"
        ],
        "PhDPrograms": [
            "Management Sciences",
            "Education",
            "Political Science",
            "International Relations",
            "Pakistan Studies",
            "English",
            "Urdu"
        ]
    },
    "Karachi School of Business and Leadership": {
        "BSPrograms": [
            "Business Administration",
            "Computer Science",
            "Economics",
            "Social Sciences"
        ],
        "MSPrograms": [
            "Business Administration",
            "Computer Science"
        ],
        "PhDPrograms": []
    },
    "Institute for Art and Culture": {
        "BSPrograms": [
            "Fine Arts",
            "Design",
            "Architecture",
            "Media Studies"
        ],
        "MSPrograms": [
            "Fine Arts"
        ],
        "PhDPrograms": []
    },
    "International Islamic University": {
        "BSPrograms": [
            "Computer Science",
            "Software Engineering",
            "Business Administration",
            "Islamic Studies",
            "International Relations",
            "Law",
            "Economics",
            "English",
            "Arabic",
            "Urdu"
        ],
        "MSPrograms": [
            "Computer Science",
            "Business Administration",
            "Islamic Studies",
            "International Relations",
            "Economics"
        ],
        "PhDPrograms": [
            "Computer Science",
            "Islamic Studies",
            "International Relations",
            "Economics"
        ]
    },
    "Preston University, Kohat": {
        "BSPrograms": [
            "Computer Science",
            "Software Engineering",
            "Business Administration",
            "Information Technology",
            "Education",
            "Psychology"
        ],
        "MSPrograms": [
            "Computer Science",
            "Business Administration",
            "Education"
        ],
        "PhDPrograms": []
    },
    "Preston University, Karachi": {
        "BSPrograms": [
            "Computer Science",
            "Software Engineering",
            "Business Administration",
            "Information Technology",
            "Education",
            "Psychology"
        ],
        "MSPrograms": [
            "Computer Science",
            "Business Administration",
            "Education"
        ],
        "PhDPrograms": []
    },
    "Qarshi University": {
        "BSPrograms": [
            "Computer Science",
            "Software Engineering",
            "Business Administration",
            "Information Technology",
            "Pharmacy",
            "Food Science & Technology",
            "Biotechnology",
            "Education"
        ],
        "MSPrograms": [
            "Computer Science",
            "Business Administration",
            "Pharmacy"
        ],
        "PhDPrograms": []
    },
    "University of Azad Jammu & Kashmir": {
        "BSPrograms": [
            "Computer Science",
            "Software Engineering",
            "Physics",
            "Chemistry",
            "Mathematics",
            "Economics",
            "Business Administration",
            "English",
            "Education",
            "Law"
        ],
        "MSPrograms": [
            "Computer Science",
            "Physics"
        ],
        "PhDPrograms": []
    },
    "University of Sahiwal": {
        "BSPrograms": [
            "Computer Science",
            "Physics",
            "Chemistry",
            "Mathematics",
            "Education",
            "English",
            "Business Administration",
            "Commerce",
            "Accounting & Finance",
            "Banking & Finance"
        ],
        "MSPrograms": [
            "Computer Science",
            "Physics"
        ],
        "PhDPrograms": []
    }
}


def main():
    db = get_supabase()
    result = db.table('universities').select('id, name, programs').execute()
    universities = result.data
    
    updated = 0
    
    for name, programs in CORRECTIONS.items():
        # Find the university
        matched = None
        for u in universities:
            if u['name'] == name:
                matched = u
                break
        
        if not matched:
            print(f"NOT FOUND: {name}")
            continue
        
        # Update
        db.table('universities').update({
            'programs': programs,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', matched['id']).execute()
        
        total = sum(len(v) for v in programs.values())
        print(f"FIXED: {name} ({total} programs)")
        updated += 1
    
    print(f"\nUpdated {updated} universities")


if __name__ == "__main__":
    main()

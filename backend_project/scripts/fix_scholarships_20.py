"""Fix the last 20 universities with missing scholarship data."""

import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase

SCHOLARSHIPS = {
    "Government College Women University (GCWU) Faisalabad": {
        "merit": ["GCWU Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "Punjab Government Scholarship"],
        "details": "Women-only merit and need-based scholarships."
    },
    "Lahore College for Women University (LCWU)": {
        "merit": ["LCWU Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "LCWU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "LCWU offers merit-based tuition waivers and need-based financial aid."
    },
    "Government Sadiq College Women University Bahawalpur": {
        "merit": ["GSCWU Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "Punjab Government Scholarship"],
        "details": "Women-focused merit and need-based scholarships."
    },
    "University of Science & Technology Bannu (USTB)": {
        "merit": ["USTB Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["FATA Development Package", "Pakistan Bait-ul-Maal"],
        "details": "Merit and need-based scholarships for students in Bannu and tribal regions."
    },
    "Lahore University of Management Sciences (LUMS)": {
        "merit": ["LUMS National Merit Scholarship (100% Tuition)", "LUMS Dean's List Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["LUMS Need-Based Financial Aid (up to 100%)", "PEEF Need-Based Scholarship", "HEC Need-Based Financial Aid"],
        "government": ["PEEF Scholarship"],
        "international": ["Fulbright Scholarship", "Chevening Scholarship", "Erasmus Mundus"],
        "details": "Over 40% of LUMS students receive financial aid. Need-based aid covers full tuition, boarding, and stipend."
    },
    "University of Management & Technology (UMT) Lahore": {
        "merit": ["UMT Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "UMT Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["HEC International Scholarship"],
        "details": "Ibrahim Hasan Murad Scholarship for top performers. Merit and need-based programs available."
    },
    "National University of Medical Sciences (NUMS) Rawalpindi": {
        "merit": ["NUMS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "NUMS Financial Aid", "Armed Forces Scholarship"],
        "government": ["Pakistan Army Medical Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["WHO Scholarship"],
        "details": "NUMS provides medical education scholarships. Armed Forces medical college scholarships available."
    },
    "Karachi Institute of Economics & Technology (KIET)": {
        "merit": ["KIET Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KIET Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "KIET provides merit and need-based scholarships for business and technology programs."
    },
    "Mirpur University of Science & Technology (MUST)": {
        "merit": ["MUST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "AJK Government Scholarship"],
        "government": ["AJK Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "MUST Mirpur provides merit scholarships and need-based financial aid."
    },
    "University of Agriculture Faisalabad (UAF)": {
        "merit": ["UAF Merit Scholarship", "HEC Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "UAF Financial Aid"],
        "government": ["Pakistan Agricultural Research Council Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["USAID Agricultural Scholarship", "Fulbright Scholarship"],
        "details": "UAF offers merit scholarships and agricultural research funding. PARC and USAID provide international scholarships."
    },
    "Government College University Faisalabad (GCUF)": {
        "merit": ["GCUF Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "GCUF Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "GCUF provides merit and need-based scholarships."
    },
    "University of Education Lahore (UE)": {
        "merit": ["UE Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Punjab Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "UE provides merit and need-based scholarships for education-focused programs."
    },
    "Dow University of Health Sciences (DUHS)": {
        "merit": ["DUHS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship", "DUHS Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["WHO Scholarship"],
        "details": "DUHS provides medical and health sciences scholarships."
    },
    "Benazir Bhutto Shaheed University Lyari Karachi": {
        "merit": ["BBLSU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "BBLSU provides merit and need-based scholarships for Lyari and Karachi students."
    },
    "National University of Sciences & Technology (NUST)": {
        "merit": ["NUST Merit Scholarship (100% Tuition)", "PEEF Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "NUST Financial Aid Program"],
        "government": ["Pakistan Army/Navy/Air Force Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship", "Chevening Scholarship", "Commonwealth Scholarship"],
        "details": "Top NET scorers get full tuition waiver. Military-sponsored scholarships for armed forces personnel and dependents."
    },
    "International Islamic University Islamabad (IIUI)": {
        "merit": ["IIUI Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "IIUI Financial Aid", "OIC Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "OIC Member States Scholarship"],
        "international": ["OIC Scholarship", "Turkish Government Scholarship", "Saudi Government Scholarship"],
        "details": "IIUI provides Islamic education scholarships and OIC member state scholarships."
    },
    "Air University Islamabad": {
        "merit": ["AU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Air University Financial Aid"],
        "government": ["Pakistan Air Force Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "Air University provides merit and PAF-sponsored scholarships."
    },
    "The Islamia University of Bahawalpur (IUB)": {
        "merit": ["IUB Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "IUB provides merit and need-based financial assistance programs."
    },
    "University of Karachi": {
        "merit": ["UoK Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship", "UoK Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship", "Commonwealth Scholarship"],
        "details": "Pakistan's largest university by enrollment with multiple departmental scholarships."
    },
    "University of Swat": {
        "merit": ["UoS Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["KP Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "University of Swat provides merit and need-based scholarships."
    }
}


def main():
    db = get_supabase()
    result = db.table('universities').select('id, name, scholarships').execute()
    universities = result.data

    updated = 0
    not_found = 0

    for target_name, scholarships in SCHOLARSHIPS.items():
        matched = None
        for u in universities:
            if u['name'] == target_name:
                matched = u
                break

        if not matched:
            print(f"NOT FOUND: {target_name}")
            not_found += 1
            continue

        db.table('universities').update({
            'scholarships': scholarships,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', matched['id']).execute()
        updated += 1
        count = sum(len(v) for v in scholarships.values() if isinstance(v, list))
        print(f"UPDATED: {matched['name']} ({count} types)")

    print(f"\n=== DONE === Updated: {updated}, Not found: {not_found}")


if __name__ == "__main__":
    main()

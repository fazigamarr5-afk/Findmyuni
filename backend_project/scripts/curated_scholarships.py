"""
Import curated scholarship data for remaining 75 universities.
Based on HEC, HEC Ehsaas, PEEF, and university-specific scholarship programs.
"""

import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase

# Curated scholarship data for 75 universities
# Each entry: (partial name match, scholarships dict)
SCHOLARSHIPS = {
    "University of Engineering & Technology": {
        "merit": ["HEC Merit Scholarship", "UET Merit Scholarship (100% Tuition)", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "Bait-ul-Maal Scholarship", "UET Financial Aid Program"],
        "government": ["PEC Engineering Scholarship", "Pakistan Bait-ul-Maal", "FATA Scholarship Program"],
        "international": ["Commonwealth Scholarship", "Turkish Government Scholarship (for MS/PhD)"],
        "details": "UET Lahore offers one of Pakistan's most generous merit scholarship programs with up to 100% tuition waiver for top scorers in ECAT. PEEF and HEC need-based aid covers tuition + stipend."
    },
    "Government College University (GCU) Lahore": {
        "merit": ["GCU Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "GCU Financial Aid Fund"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Commonwealth Scholarship (for postgraduate)"],
        "details": "GCU Lahore provides merit scholarships based on matric/inter marks. Named scholarships include Iqbal Scholarship and Raja Sahib Scholarship."
    },
    "Government College Women University Faisalabad": {
        "merit": ["GCWU Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "Punjab Government Need-Based Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Women-only merit and need-based scholarships. Punjab Government provides additional quota for women's universities."
    },
    "Lahore College for Women University": {
        "merit": ["LCWU Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "LCWU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "LCWU offers merit-based tuition waivers and need-based financial aid. Women empowerment scholarships available through Punjab government."
    },
    "Fatima Jinnah Women University": {
        "merit": ["FJWU Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "FJWU offers merit scholarships based on academic performance. Named scholarships include Quaid-e-Azam Scholarship."
    },
    "University of Sargodha": {
        "merit": ["UOS Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "UOS Financial Aid Fund"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "University of Sargodha provides merit and need-based scholarships through HEC, PEEF, and university funds."
    },
    "Khwaja Fareed University": {
        "merit": ["KFUEIT Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "Punjab Government Scholarship"],
        "details": "KFUEIT provides merit-based scholarships for top performers and need-based financial aid."
    },
    "Nawaz Sharif University": {
        "merit": ["NSUET Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "NSUET offers merit and need-based scholarships. PM's Laptop Scheme beneficiaries eligible."
    },
    "University of Gujrat": {
        "merit": ["UoG Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "UoG Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "UoG provides merit scholarships covering up to 50% tuition for top 10% of each batch."
    },
    "University of Malakand": {
        "merit": ["UoM Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "FATA/KP Government Scholarship"],
        "government": ["FATA Development Package", "KP Government Scholarship"],
        "details": "University of Malakand provides scholarships through HEC and KP government programs. Special quotas for merged tribal districts students."
    },
    "University of Chitral": {
        "merit": ["UoC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["FATA Development Package", "KP Government Scholarship"],
        "details": "Merit and need-based scholarships. Special financial assistance for students from remote Chitral district."
    },
    "University of Haripur": {
        "merit": ["UoH Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "University of Haripur provides merit and need-based financial aid programs."
    },
    "Kohat University": {
        "merit": ["KUST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["FATA Development Package", "Pakistan Bait-ul-Maal"],
        "details": "KUST offers merit and need-based scholarships. Special programs for merged tribal district students."
    },
    "Hazara University": {
        "merit": ["HU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Hazara University provides merit-based tuition waivers and need-based financial assistance."
    },
    "Kohsar University Murree": {
        "merit": ["Kohsar Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Punjab Government Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Kohsar University provides merit and need-based financial aid for students."
    },
    "Government Sadiq College Women University": {
        "merit": ["GSCWU Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "Punjab Government Scholarship"],
        "details": "Women-focused merit and need-based scholarships. Bahawalpur region specific quotas available."
    },
    "NED University": {
        "merit": ["NED Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship", "NED Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["USAID Merit Scholarship"],
        "details": "NED offers generous merit scholarships for top ECAT/NTS scorers. Sindh government provides additional need-based aid."
    },
    "University of Sindh Jamshoro": {
        "merit": ["USindh Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "University of Sindh provides merit and need-based scholarships. Sindh government special education funds available."
    },
    "Liaquat University of Medical & Health Sciences": {
        "merit": ["LUMHS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["WHO Scholarship"],
        "details": "LUMHS provides merit scholarships for medical students. Special scholarships for nursing and allied health programs."
    },
    "Sindh Madressatul Islam University": {
        "merit": ["SMIU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship"],
        "details": "SMIU provides merit-based scholarships and need-based financial aid. Pakistan's oldest university with rich scholarship tradition."
    },
    "Sindh Agriculture University": {
        "merit": ["SAU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "SAU provides agriculture-specific scholarships. Provincial government offers special quotas for agricultural education."
    },
    "QUEST Nawabshah": {
        "merit": ["QUEST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "QUEST provides merit and need-based scholarships for engineering and technology students."
    },
    "University of Peshawar": {
        "merit": ["UoP Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["KP Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship", "CHEVENING Scholarship"],
        "details": "UoP is one of Pakistan's oldest universities with extensive scholarship programs. Named scholarships include Bacha Khan Scholarship."
    },
    "University of Science & Technology Bannu": {
        "merit": ["USTB Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["FATA Development Package", "Pakistan Bait-ul-Maal"],
        "details": "USTB provides merit and need-based scholarships. Special programs for students from Bannu and tribal regions."
    },
    "FATA University": {
        "merit": ["FATA U Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "FATA Development Package"],
        "government": ["FATA Development Package", "KP Government Scholarship"],
        "details": "Special scholarship programs for students from merged tribal districts. Full fee waivers available for eligible students."
    },
    "Quaid-i-Azam University": {
        "merit": ["QAU Merit Scholarship", "HEC Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "QAU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Commonwealth Scholarship", "Fulbright Scholarship", "Erasmus Mundus"],
        "details": "QAU offers multiple merit scholarships including Rector's Gold Medal Scholarship. Research funding available for MS/PhD students."
    },
    "COMSATS University Islamabad": {
        "merit": ["CUI Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "CUI Financial Aid Program"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["HEC International Scholarship"],
        "details": "COMSATS provides merit-based tuition discounts (25-75%) based on admission test scores. Need-based aid covers up to 100% tuition."
    },
    "Bahria University": {
        "merit": ["BU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Bahria Foundation Scholarship"],
        "government": ["Pakistan Navy Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Turkish Government Scholarship"],
        "details": "Bahria University offers Navy-sponsored scholarships and merit-based financial aid. Special programs for military dependents."
    },
    "Institute of Space Technology": {
        "merit": ["IST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "IST Financial Aid"],
        "government": ["SUPARCO Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["NASA Space Grant", "JAXA Scholarship"],
        "details": "IST provides space-technology specific scholarships. Pakistan Space and Upper Atmosphere Research Commission (SUPARCO) sponsors research grants."
    },
    "Allama Iqbal Open University": {
        "merit": ["AIOU Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "AIOU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal", "Workers Welfare Fund"],
        "details": "AIOU provides affordable distance education with fee concessions for need-based students. Special programs for overseas Pakistanis."
    },
    "University of Balochistan": {
        "merit": ["UoB Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Balochistan Government Scholarship"],
        "government": ["Balochistan Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "UoB provides merit and need-based scholarships. Balochistan government offers special education packages for provincial students."
    },
    "BUITEMS": {
        "merit": ["BUITEMS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Balochistan Government Scholarship"],
        "government": ["Balochistan Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "BUITEMS provides merit scholarships and need-based financial aid. Balochistan government education initiatives."
    },
    "Lasbela University": {
        "merit": ["LUAWMS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Balochistan Government Scholarship"],
        "government": ["Balochistan Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "LUAWMS provides scholarships for marine sciences and agriculture students. Special quotas for Lasbela district."
    },
    "Lahore University of Management Sciences": {
        "merit": ["LUMS National Merit Scholarship (100% Tuition)", "LUMS Dean's List Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["LUMS Need-Based Financial Aid (up to 100%)", "PEEF Need-Based Scholarship", "HEC Need-Based Financial Aid"],
        "government": ["PEEF Scholarship"],
        "international": ["Stanford Knight-Hennessy (for LUMS grads)", "Fulbright Scholarship", "Chevening Scholarship", "Erasmus Mundus"],
        "details": "LUMS offers one of Pakistan's most generous financial aid programs. Over 40% of students receive some form of scholarship. Need-based aid covers full tuition, boarding, and stipend for qualifying students."
    },
    "FAST National University": {
        "merit": ["FAST Merit Scholarship (100% Tuition for Top 5%)", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "FAST Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship"],
        "details": "FAST provides merit scholarships based on FAST Entry Test scores. Top 5% get full tuition waiver. 10-50% tuition discounts for next tier."
    },
    "SZABIST": {
        "merit": ["SZABIST Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "SZABIST Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "SZABIST provides merit-based scholarships for high academic achievers. Named scholarships include Bhutto Scholarship Program."
    },
    "Iqra University": {
        "merit": ["IU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "IU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Iqra University provides merit and need-based scholarships across all campuses."
    },
    "Riphah International University": {
        "merit": ["RIU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "RIU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Riphah provides merit scholarships and need-based financial assistance. Islamic banking programs have additional scholarships."
    },
    "Lahore Leads University": {
        "merit": ["LLU Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "LLU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Leads University provides merit and need-based financial aid for students."
    },
    "Capital University": {
        "merit": ["CUST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "CUST Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "CUST provides merit scholarships and need-based financial assistance for engineering and management students."
    },
    "University of Management & Technology": {
        "merit": ["UMT Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "UMT Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["HEC International Scholarship"],
        "details": "UMT provides merit-based tuition discounts and need-based financial aid. Ibrahim Hasan Murad Scholarship for top performers."
    },
    "Punjab Institute of Computer Science": {
        "merit": ["PICS Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PICS Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "PICS provides merit scholarships for computer science and IT students."
    },
    "Preston University": {
        "merit": ["Preston Merit Scholarship"],
        "need_based": ["Preston Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Preston University provides merit and need-based financial aid for enrolled students."
    },
    "National University of Medical Sciences": {
        "merit": ["NUMS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "NUMS Financial Aid", "Armed Forces Scholarship"],
        "government": ["Pakistan Army Medical Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["WHO Scholarship"],
        "details": "NUMS provides medical education scholarships. Armed Forces medical college scholarships and HEC need-based aid available."
    },
    "Bahria Foundation College": {
        "merit": ["BFC Merit Scholarship"],
        "need_based": ["Bahria Foundation Financial Aid"],
        "government": ["Pakistan Navy Scholarship"],
        "details": "Bahria Foundation provides scholarships for students in foundation colleges affiliated with Pakistan Navy."
    },
    "Karachi Institute of Economics & Technology": {
        "merit": ["KIET Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KIET Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "KIET provides merit and need-based scholarships for business and technology programs."
    },
    "Indus University": {
        "merit": ["Indus Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Indus Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "Indus University provides merit and need-based scholarships across architecture, engineering, and design programs."
    },
    "Mukabbir University": {
        "merit": ["MUST Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid"],
        "government": ["Punjab Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "Mukabbir University provides merit and need-based financial assistance."
    },
    "University of Azad Jammu & Kashmir": {
        "merit": ["UAJK Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "AJK Government Scholarship"],
        "government": ["AJK Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Turkish Government Scholarship"],
        "details": "UAJK provides merit and need-based scholarships. AJK government has special education funds for students."
    },
    "Mirpur University of Science & Technology": {
        "merit": ["MUST Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "AJK Government Scholarship"],
        "government": ["AJK Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "MUST Mirpur provides merit scholarships and need-based financial aid for technology students."
    },
    "University of the Punjab": {
        "merit": ["PU Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "PU Financial Aid Fund"],
        "government": ["Punjab Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Commonwealth Scholarship", "Fulbright Scholarship", "Chevening Scholarship", "Erasmus Mundus"],
        "details": "PU Lahore, Pakistan's largest university, offers extensive merit and need-based scholarships. Multiple named scholarships including Allama Iqbal Scholarship and Quaid-e-Azam Scholarship."
    },
    "Bahauddin Zakariya University": {
        "merit": ["BZU Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "BZU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship"],
        "details": "BZU Multan provides merit and need-based scholarships. Named scholarships include Bahauddin Zakariya Trust Scholarship."
    },
    "University of Agriculture Faisalabad": {
        "merit": ["UAF Merit Scholarship", "HEC Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "UAF Financial Aid"],
        "government": ["Pakistan Agricultural Research Council Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["USAID Agricultural Scholarship", "Fulbright Scholarship"],
        "details": "UAF offers merit scholarships and agricultural research funding. PARC and USAID provide additional international scholarships for agriculture students."
    },
    "Government College University Faisalabad": {
        "merit": ["GCUF Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "GCUF Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "GCUF provides merit and need-based scholarships. Named scholarships include Raja Sahib of Mahmudabad Scholarship."
    },
    "Islamia University Bahawalpur": {
        "merit": ["IUB Merit Scholarship", "PEEF Merit Scholarship", "Punjab Government Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship", "IUB Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "IUB provides merit and need-based scholarships. Bahawalpur region specific financial aid programs."
    },
    "Abdul Wali Khan University Mardan": {
        "merit": ["AWKUM Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["KP Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "AWKUM provides merit and need-based scholarships for students in Mardan and surrounding areas."
    },
    "University of Education Lahore": {
        "merit": ["UE Merit Scholarship", "PEEF Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "PEEF Need-Based Scholarship"],
        "government": ["Punjab Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "UE provides merit and need-based scholarships for education-focused programs."
    },
    "Dow University of Health Sciences": {
        "merit": ["DUHS Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship", "DUHS Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["WHO Scholarship"],
        "details": "DUHS provides medical and health sciences scholarships. Sindh government medical education scholarships available."
    },
    "Benazir Bhutto Shaheed University Lyari": {
        "merit": ["BBLSU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "BBLSU provides merit and need-based scholarships for students from Lyari and Karachi."
    },
    "Shah Abdul Latif University": {
        "merit": ["SALU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "SALU provides merit and need-based scholarships for students in Khairpur and Sindh."
    },
    "Sukkur IBA University": {
        "merit": ["IBA Sukkur Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Sindh Government Scholarship", "IBA Financial Aid"],
        "government": ["Sindh Government Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["USAID Scholarship"],
        "details": "IBA Sukkur provides merit scholarships covering up to 100% tuition for top performers. Strong financial aid program."
    },
    "National University of Sciences & Technology": {
        "merit": ["NUST Merit Scholarship (100% Tuition)", "PEEF Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "NUST Financial Aid Program"],
        "government": ["Pakistan Army/Navy/Air Force Scholarship", "Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship", "Chevening Scholarship", "Commonwealth Scholarship"],
        "details": "NUST offers generous merit scholarships based on NET (NUST Entry Test). Top scorers get full tuition waiver. Military-sponsored scholarships for armed forces personnel and dependents."
    },
    "International Islamic University Islamabad": {
        "merit": ["IIUI Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "IIUI Financial Aid", "OIC Scholarship"],
        "government": ["Pakistan Bait-ul-Maal", "OIC Member States Scholarship"],
        "international": ["OIC Scholarship", "Turkish Government Scholarship", "Saudi Government Scholarship"],
        "details": "IIUI provides Islamic education scholarships and OIC member state scholarships. International students from Muslim countries get special fee structures."
    },
    "Air University": {
        "merit": ["AU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Air University Financial Aid"],
        "government": ["Pakistan Air Force Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "Air University provides merit and PAF-sponsored scholarships. Military dependents get special fee concessions."
    },
    "Al-Hamd Islamic University": {
        "merit": ["AIU Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid"],
        "government": ["Balochistan Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "AIU provides merit and need-based scholarships for students in Quetta."
    },
    "GIKI": {
        "merit": ["GIKI Merit Scholarship (100% Tuition for Top 5%)", "PEEF Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "GIKI Financial Aid (up to 100%)"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Fulbright Scholarship", "Commonwealth Scholarship"],
        "details": "GIKI offers one of Pakistan's most competitive merit scholarship programs. Top 5% get full tuition. Up to 75% tuition waivers for next tier. Named scholarships include Ghulam Ishaq Khan Scholarship."
    },
    "Aga Khan University": {
        "merit": ["AKU Merit Scholarship (up to 100%)", "HEC Merit Scholarship"],
        "need_based": ["AKU Need-Based Financial Aid (up to 100%)", "HEC Need-Based Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "international": ["Aga Khan Foundation Scholarship", "WHO Scholarship"],
        "details": "AKU provides one of Pakistan's most generous financial aid programs. Over 50% of medical students receive financial assistance. Aga Khan Foundation provides additional international scholarships."
    },
    "Hamdard University": {
        "merit": ["Hamdard Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Hamdard Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Hamdard University provides merit and need-based scholarships. Hakim Said Scholarship for top performers."
    },
    "Foundation University": {
        "merit": ["FUI Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "FUI Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal"],
        "details": "Foundation University provides merit and need-based scholarships for students in Rawalpindi."
    },
    "The Islamia University of Bahawalpur": {
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
        "details": "UoK, Pakistan's largest university by enrollment, provides merit and need-based scholarships. Multiple departments offer their own scholarship programs."
    },
    "University of Swat": {
        "merit": ["UoS Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["KP Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "University of Swat provides merit and need-based scholarships for students in Swat valley."
    },
    "University of Swabi": {
        "merit": ["UoS Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "KP Government Scholarship"],
        "government": ["KP Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "University of Swabi provides merit and need-based financial assistance."
    },
    "University of Turbat": {
        "merit": ["UoT Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "Balochistan Government Scholarship"],
        "government": ["Balochistan Government Scholarship", "Pakistan Bait-ul-Maal"],
        "details": "University of Turbat provides scholarships for students in southern Balochistan."
    },
    "Virtual University of Pakistan": {
        "merit": ["VU Merit Scholarship", "HEC Merit Scholarship"],
        "need_based": ["HEC Need-Based Financial Aid", "VU Financial Aid"],
        "government": ["Pakistan Bait-ul-Maal", "Workers Welfare Fund"],
        "details": "VU provides affordable distance education with merit scholarships. Workers Welfare Fund scholarships available for factory workers and dependents."
    }
}


def main():
    db = get_supabase()
    result = db.table('universities').select('id, name, scholarships').execute()
    universities = result.data

    updated = 0
    skipped = 0
    not_found = 0

    for search_name, scholarships in SCHOLARSHIPS.items():
        matched = None
        for u in universities:
            u_name = u['name'].lower()
            s_name = search_name.lower()
            if s_name in u_name or u_name in s_name:
                matched = u
                break
            # Fuzzy word match
            s_words = set(s_name.replace(',', '').replace('&', '').replace('(', '').replace(')', '').split())
            u_words = set(u_name.replace(',', '').replace('&', '').replace('(', '').replace(')', '').split())
            if len(s_words & u_words) >= min(3, len(s_words)):
                matched = u
                break

        if not matched:
            print(f"NOT FOUND: {search_name}")
            not_found += 1
            continue

        existing = matched.get('scholarships')
        if existing and isinstance(existing, dict) and len(str(existing)) > 50:
            skipped += 1
            continue

        db.table('universities').update({
            'scholarships': scholarships,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('id', matched['id']).execute()
        updated += 1
        count = sum(len(v) for v in scholarships.values() if isinstance(v, list))
        print(f"UPDATED: {matched['name']} ({count} scholarship types)")

    print(f"\n=== DONE ===")
    print(f"Updated: {updated}")
    print(f"Skipped (already has): {skipped}")
    print(f"Not found: {not_found}")


if __name__ == "__main__":
    main()

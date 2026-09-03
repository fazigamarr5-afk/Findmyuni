"""
Comprehensive Pakistan University Data Collector
Scrapes from pakadmissions.com + enriches with known data
Imports directly into Supabase

Usage:
  pip install supabase requests beautifulsoup4
  Set env: SUPABASE_URL and SUPABASE_SERVICE_KEY
  python scripts/collect_universities.py
"""

import requests
from bs4 import BeautifulSoup
import re
import os
import sys
import json
import time
import logging
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# COMPREHENSIVE PAKISTANI UNIVERSITY DATABASE
# This is our master list - scraped data gets merged on top
# ============================================================

MASTER_UNIVERSITIES = [
    # ===== PUNJAB - PUBLIC =====
    {"name": "University of the Punjab", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 1882, "website": "pu.edu.pk", "type": "Comprehensive",
     "description": "The University of the Punjab is the oldest and largest university in Pakistan, established in 1882. It offers programs across arts, science, engineering, medicine, law, and commerce.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "Psychology", "English", "Urdu", "Business Administration", "Commerce", "Law", "Medicine", "Statistics", "Sociology", "Geography", "History", "Philosophy", "Public Administration", "Social Work", "Fine Arts", "Mass Communication", "Library Science", "Education"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "English", "Business Administration"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Political Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "University of Engineering & Technology (UET) Lahore", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 1921, "website": "uet.edu.pk", "type": "Engineering",
     "description": "UET Lahore is the oldest and largest engineering university in Pakistan with strong industry connections.",
     "programs": {"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Science", "Software Engineering", "Architecture", "City & Regional Planning", "Metallurgy & Materials Engineering", "Mining Engineering", "Petroleum Engineering", "Energy Engineering"], "MSPrograms": ["Structural Engineering", "Transportation Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"], "PhDPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "transport": True}},

    {"name": "Government College University (GCU) Lahore", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 1864, "website": "gc.uop.edu.pk", "type": "Comprehensive",
     "description": "GCU Lahore is one of the oldest and most prestigious institutions in South Asia, known for producing Nobel laureates.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Urdu", "Political Science", "Psychology", "Sociology", "Commerce", "Statistics"], "MSPrograms": ["Physics", "Chemistry", "Mathematics", "Economics", "English"], "PhDPrograms": ["Physics", "Chemistry", "Mathematics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "Bahauddin Zakariya University (BZU) Multan", "city": "Multan", "province": "Punjab", "sector": "Public", "established": 1975, "website": "bzu.edu.pk", "type": "Comprehensive",
     "description": "BZU is a major public university in South Punjab offering diverse programs.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "Commerce", "Education", "Law", "Medicine", "Agriculture", "Engineering"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Economics"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "Government College Women University (GCWU) Faisalabad", "city": "Faisalabad", "province": "Punjab", "sector": "Public", "established": 2012, "website": "gcwu.edu.pk", "type": "Comprehensive",
     "description": "GCWU Faisalabad is a leading women's university in Punjab.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Education"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "University of Agriculture Faisalabad (UAF)", "city": "Faisalabad", "province": "Punjab", "sector": "Public", "established": 1906, "website": "uaf.edu.pk", "type": "Agricultural",
     "description": "UAF is Pakistan's largest agricultural university.",
     "programs": {"BSPrograms": ["Agriculture", "Food Science & Technology", "Veterinary Science", "Biochemistry", "Microbiology", "Computer Science", "Electrical Engineering", "Civil Engineering", "Chemistry", "Plant Pathology", "Entomology", "Agronomy"], "MSPrograms": ["Agriculture", "Food Science", "Veterinary Science", "Biochemistry"], "PhDPrograms": ["Agriculture", "Food Science", "Veterinary Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "agricultural_farms": True}},

    {"name": "Lahore College for Women University (LCWU)", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 1922, "website": "lcwu.edu.pk", "type": "Comprehensive",
     "description": "LCWU is one of the oldest and largest women's universities in Pakistan.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Psychology", "Education", "Fine Arts", "Media Studies"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Fatima Jinnah Women University (FJWU) Rawalpindi", "city": "Rawalpindi", "province": "Punjab", "sector": "Public", "established": 1998, "website": "fjwu.edu.pk", "type": "Comprehensive",
     "description": "FJWU is the first women's university in Rawalpindi.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Psychology", "Education"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "University of Sargodha (UOS)", "city": "Sargodha", "province": "Punjab", "sector": "Public", "established": 2002, "website": "uos.edu.pk", "type": "Comprehensive",
     "description": "University of Sargodha offers diverse programs in arts, science, and technology.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Law", "Medicine"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "Khwaja Fareed University of Engineering & Information Technology (KFUEIT)", "city": "Rahim Yar Khan", "province": "Punjab", "sector": "Public", "established": 2014, "website": "kfueit.edu.pk", "type": "Engineering",
     "description": "KFUEIT is a growing engineering university in South Punjab.",
     "programs": {"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering", "Architecture"], "MSPrograms": ["Civil Engineering", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Nawaz Sharif University of Engineering & Technology (NSUET) Multan", "city": "Multan", "province": "Punjab", "sector": "Public", "established": 2015, "website": "nsuet.edu.pk", "type": "Engineering",
     "description": "NSUET Multan focuses on engineering and technology programs.",
     "programs": {"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering"], "MSPrograms": ["Civil Engineering", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Government College University Faisalabad (GCUF)", "city": "Faisalabad", "province": "Punjab", "sector": "Public", "established": 1897, "website": "gcuf.edu.pk", "type": "Comprehensive",
     "description": "GCUF is a prestigious institution with a rich academic heritage.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Law"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "University of Gujrat (UoG)", "city": "Gujrat", "province": "Punjab", "sector": "Public", "established": 2004, "website": "uog.edu.pk", "type": "Comprehensive",
     "description": "University of Gujrat is a growing public university in northern Punjab.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Media Studies"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Islamia University Bahawalpur (IUB)", "city": "Bahawalpur", "province": "Punjab", "sector": "Public", "established": 1975, "website": "iub.edu.pk", "type": "Comprehensive",
     "description": "IUB is a major university in southern Punjab.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Agriculture", "Law"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "University of Malakand", "city": "Malakand", "province": "KPK", "sector": "Public", "established": 2001, "website": "uom.edu.pk", "type": "Comprehensive",
     "description": "University of Malakand serves the Malakand Division in KPK.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education", "Journalism"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "University of Chitral", "city": "Chitral", "province": "KPK", "sector": "Public", "established": 2017, "website": "uoch.edu.pk", "type": "Comprehensive",
     "description": "University of Chitral is the newest public university in KPK.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "University of Swat", "city": "Swat", "province": "KPK", "sector": "Public", "established": 2012, "website": "uswat.edu.pk", "type": "Comprehensive",
     "description": "University of Swat serves the Swat Valley region.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Journalism"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "University of Haripur", "city": "Haripur", "province": "KPK", "sector": "Public", "established": 2012, "website": "uoh.edu.pk", "type": "Comprehensive",
     "description": "University of Haripur is a growing public university.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "University of Swabi", "city": "Swabi", "province": "KPK", "sector": "Public", "established": 2012, "website": "uoswabi.edu.pk", "type": "Comprehensive",
     "description": "University of Swabi serves the Swabi district.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Abdul Wali Khan University Mardan (AWKUM)", "city": "Mardan", "province": "KPK", "sector": "Public", "established": 2009, "website": "awkum.edu.pk", "type": "Comprehensive",
     "description": "AWKUM is a public university in Mardan, KPK.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Journalism"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Kohat University of Science & Technology (KUST)", "city": "Kohat", "province": "KPK", "sector": "Public", "established": 2001, "website": "kust.edu.pk", "type": "Science & Technology",
     "description": "KUST is a leading science and technology university in KPK.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Electrical Engineering", "Civil Engineering", "Education"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Hazara University Mansehra", "city": "Mansehra", "province": "KPK", "sector": "Public", "established": 2001, "website": "hu.edu.pk", "type": "Comprehensive",
     "description": "Hazara University serves the Hazara Division.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Education", "English", "Journalism", "Business Administration"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Kohsar University Murree", "city": "Murree", "province": "Punjab", "sector": "Public", "established": 2020, "website": "kum.edu.pk", "type": "Comprehensive",
     "description": "Kohsar University is a new public university in Murree.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Government Sadiq College Women University Bahawalpur", "city": "Bahawalpur", "province": "Punjab", "sector": "Public", "established": 2012, "website": "gscwu.edu.pk", "type": "Comprehensive",
     "description": "GSCWU is a women's university in Bahawalpur.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education"], "MSPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "University of Education Lahore (UE)", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 2002, "website": "ue.edu.pk", "type": "Education",
     "description": "University of Education focuses on teacher education and research.",
     "programs": {"BSPrograms": ["Education", "Computer Science", "Physics", "Chemistry", "Mathematics", "English", "Urdu", "Business Administration"], "MSPrograms": ["Education", "Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    # ===== SINDH - PUBLIC =====
    {"name": "University of Karachi", "city": "Karachi", "province": "Sindh", "sector": "Public", "established": 1951, "website": "uok.edu.pk", "type": "Comprehensive",
     "description": "University of Karachi is one of the largest universities in Pakistan by enrollment.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Statistics", "Economics", "Political Science", "Psychology", "English", "Urdu", "Commerce", "Law", "Medicine", "Pharmacy", "Business Administration", "Sociology", "International Relations"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "NED University of Engineering & Technology", "city": "Karachi", "province": "Sindh", "sector": "Public", "established": 1921, "website": "neduet.edu.pk", "type": "Engineering",
     "description": "NED University is a premier engineering institution in Karachi.",
     "programs": {"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Science & Engineering", "Software Engineering", "Industrial Engineering", "Metallurgy & Materials Engineering", "Petroleum Engineering", "Architecture"], "MSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"], "PhDPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "transport": True}},

    {"name": "University of Sindh Jamshoro", "city": "Jamshoro", "province": "Sindh", "sector": "Public", "established": 1947, "website": "usindh.edu.pk", "type": "Comprehensive",
     "description": "University of Sindh is the oldest university in Sindh.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Sindhi", "Education", "Law", "Medicine"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "medical": True}},

    {"name": "Dow University of Health Sciences (DUHS)", "city": "Karachi", "province": "Sindh", "sector": "Public", "established": 2003, "website": "duhs.edu.pk", "type": "Health Sciences",
     "description": "DUHS is a leading health sciences university in Karachi.",
     "programs": {"BSPrograms": ["Medicine", "Dentistry", "Pharmacy", "Nursing", "Public Health", "Physical Therapy", "Biomedical Engineering"], "MSPrograms": ["Public Health", "Pharmacology", "Pathology"], "PhDPrograms": ["Pharmacology", "Pathology"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "medical": True, "hospital": True}},

    {"name": "Benazir Bhutto Shaheed University Lyari Karachi", "city": "Karachi", "province": "Sindh", "sector": "Public", "established": 2011, "website": "bbsul.edu.pk", "type": "Comprehensive",
     "description": "BBSUL is a public university in Lyari, Karachi.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Business Administration", "Education", "English"], "MSPrograms": ["Computer Science"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Liaquat University of Medical & Health Sciences (LUMHS)", "city": "Jamshoro", "province": "Sindh", "sector": "Public", "established": 1881, "website": "lumhs.edu.pk", "type": "Medical",
     "description": "LUMHS is one of the oldest medical institutions in Pakistan.",
     "programs": {"BSPrograms": ["Medicine", "Dentistry", "Nursing", "Pharmacy", "Allied Health Sciences"], "MSPrograms": ["Medicine", "Surgery"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "medical": True, "hospital": True}},

    {"name": "Shah Abdul Latif University (SALU) Khairpur", "city": "Khairpur", "province": "Sindh", "sector": "Public", "established": 1987, "website": "salu.edu.pk", "type": "Comprehensive",
     "description": "SALU is a public university in Khairpur, Sindh.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Sindhi", "Education"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Sindh Madressatul Islam University (SMIU) Karachi", "city": "Karachi", "province": "Sindh", "sector": "Public", "established": 1885, "website": "smiu.edu.pk", "type": "Comprehensive",
     "description": "SMIU is one of the oldest educational institutions in Pakistan.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies", "Social Sciences"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True, "cafeteria": True}},

    {"name": "University of Sindh Agriculture (SAU) Tando Jam", "city": "Tando Jam", "province": "Sindh", "sector": "Public", "established": 1961, "website": "sau.edu.pk", "type": "Agricultural",
     "description": "SAU is the agricultural university of Sindh.",
     "programs": {"BSPrograms": ["Agriculture", "Food Science & Technology", "Forestry", "Animal Husbandry", "Computer Science"], "MSPrograms": ["Agriculture", "Food Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Quaid-e-Awam University of Engineering, Science & Technology (QUEST) Nawabshah", "city": "Nawabshah", "province": "Sindh", "sector": "Public", "established": 1997, "website": "quest.edu.pk", "type": "Engineering",
     "description": "QUEST is an engineering university in Nawabshah, Sindh.",
     "programs": {"BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering"], "MSPrograms": ["Civil Engineering", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Sukkur IBA University", "city": "Sukkur", "province": "Sindh", "sector": "Public", "established": 1994, "website": "sukkuriba.edu.pk", "type": "Business & Technology",
     "description": "Sukkur IBA is known for its quality education in business and technology.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration", "Commerce", "Data Science", "Artificial Intelligence"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    # ===== KPK - PUBLIC =====
    {"name": "University of Peshawar", "city": "Peshawar", "province": "KPK", "sector": "Public", "established": 1950, "website": "uop.edu.pk", "type": "Comprehensive",
     "description": "University of Peshawar is the oldest general university in KPK.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "English", "Urdu", "Journalism", "Law", "Education", "Geology", "Environmental Sciences"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Economics"], "PhDPrograms": ["Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "University of Science & Technology Bannu (USTB)", "city": "Bannu", "province": "KPK", "sector": "Public", "established": 2001, "website": "ustb.edu.pk", "type": "Science & Technology",
     "description": "USTB is a science and technology university in Bannu.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Electrical Engineering", "Civil Engineering", "Education"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "FATA University", "city": "Kohat", "province": "KPK", "sector": "Public", "established": 2016, "website": "fatau.edu.pk", "type": "Comprehensive",
     "description": "FATA University serves the former FATA region.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    # ===== ISLAMABAD =====
    {"name": "National University of Sciences & Technology (NUST)", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 1991, "website": "nust.edu.pk", "type": "Research",
     "description": "NUST is ranked #1 in Pakistan, offering cutting-edge programs in engineering, science, and business.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science", "Physics", "Mathematics", "Chemistry", "Business Administration", "Architecture", "Avionics", "Aerospace Engineering"], "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Business Administration"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "transport": True}},

    {"name": "Quaid-i-Azam University (QAU)", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 1967, "website": "qau.edu.pk", "type": "Research",
     "description": "QAU is a top-ranked public research university known for natural sciences and international relations.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Statistics", "Economics", "Political Science", "International Relations", "Psychology", "Sociology", "English", "Urdu", "Biology", "Geology", "Environmental Sciences", "Microbiology"], "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Political Science", "International Relations"], "PhDPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "COMSATS University Islamabad", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 1998, "website": "comsats.edu.pk", "type": "Research",
     "description": "COMSATS is a multi-campus university known for IT and science programs.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Physics", "Mathematics", "Chemistry", "Bioinformatics", "Architecture"], "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Data Science"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "International Islamic University Islamabad (IIUI)", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 1980, "website": "iiui.edu.pk", "type": "Comprehensive",
     "description": "IIUI offers programs in both modern sciences and Islamic studies.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Islamic Studies", "Arabic", "Economics", "Management Sciences", "Psychology", "Education", "Law"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Islamic Studies", "Economics"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Islamic Studies"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "mosque": True}},

    {"name": "Bahria University", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 2000, "website": "bahria.edu.pk", "type": "Comprehensive",
     "description": "Bahria University is sponsored by the Pakistan Navy.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering", "Civil Engineering", "Management Sciences", "Psychology", "Media Studies", "Law"], "MSPrograms": ["Computer Science", "Software Engineering", "Management Sciences"], "PhDPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "transport": True}},

    {"name": "Air University Islamabad", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 2002, "website": "air.edu.pk", "type": "Research",
     "description": "Air University is established by the Pakistan Air Force.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Avionics Engineering", "Aerospace Engineering", "Management Sciences"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Management Sciences"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "transport": True}},

    {"name": "Institute of Space Technology (IST)", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 2002, "website": "ist.edu.pk", "type": "Space & Technology",
     "description": "IST specializes in space science and technology.",
     "programs": {"BSPrograms": ["Aviation Engineering", "Materials Science & Engineering", "Electrical Engineering", "Mechanical Engineering", "Space Science", "Remote Sensing & Geo-Information Science", "Physics", "Mathematics"], "MSPrograms": ["Materials Science", "Remote Sensing", "Space Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Allama Iqbal Open University (AIOU)", "city": "Islamabad", "province": "Islamabad", "sector": "Public", "established": 1974, "website": "aiou.edu.pk", "type": "Distance Learning",
     "description": "AIOU is Pakistan's largest open university for distance education.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration", "Commerce", "Education", "English", "Urdu", "Mathematics", "Physics", "Chemistry", "Economics", "Mass Communication", "Library Science", "Agriculture"], "MSPrograms": ["Computer Science", "Business Administration", "Education"], "PhDPrograms": ["Computer Science", "Education"]},
     "facilities": {"library": True, "wifi": True}},

    # ===== BALOCHISTAN =====
    {"name": "University of Balochistan", "city": "Quetta", "province": "Balochistan", "sector": "Public", "established": 1970, "website": "uob.edu.pk", "type": "Comprehensive",
     "description": "University of Balochistan is the oldest and largest university in Balochistan.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Balochi", "Education", "Law", "Journalism", "Political Science"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Balochistan University of Information Technology & Management Sciences (BUITEMS)", "city": "Quetta", "province": "Balochistan", "sector": "Public", "established": 2001, "website": "buitms.edu.pk", "type": "Technology",
     "description": "BUITEMS is the leading IT university in Balochistan.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Electrical Engineering", "Civil Engineering", "Business Administration", "Media Studies"], "MSPrograms": ["Computer Science", "Software Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "University of Turbat", "city": "Turbat", "province": "Balochistan", "sector": "Public", "established": 2012, "website": "uot.edu.pk", "type": "Comprehensive",
     "description": "University of Turbat serves the southern Balochistan region.",
     "programs": {"BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Business Administration", "Education", "English"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "Lasbela University of Agriculture, Water & Marine Sciences (LUAWMS)", "city": "Uthal", "province": "Balochistan", "sector": "Public", "established": 2005, "website": "luawms.edu.pk", "type": "Agricultural",
     "description": "LUAWMS focuses on agriculture, water, and marine sciences.",
     "programs": {"BSPrograms": ["Agriculture", "Computer Science", "Marine Sciences", "Fisheries", "Food Science"], "MSPrograms": ["Agriculture"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    {"name": "Al-Hamd Islamic University Quetta", "city": "Quetta", "province": "Balochistan", "sector": "Private", "established": 2005, "website": "alhamd.edu.pk", "type": "Comprehensive",
     "description": "Al-Hamd Islamic University is a private university in Quetta.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Business Administration", "English", "Education", "Islamic Studies", "Law"], "MSPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},

    # ===== PRIVATE UNIVERSITIES =====
    {"name": "Lahore University of Management Sciences (LUMS)", "city": "Lahore", "province": "Punjab", "sector": "Private", "established": 1984, "website": "lums.edu.pk", "type": "Research",
     "description": "LUMS is Pakistan's top private university, known for business, CS, and liberal arts.",
     "programs": {"BSPrograms": ["Computer Science", "Electrical Engineering", "Chemical Engineering", "Civil Engineering", "Economics", "Political Science", "Psychology", "Sociology", "Anthropology", "English", "History", "Mathematics", "Physics", "Biology", "Business Administration"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Business Administration", "Economics", "Education"], "PhDPrograms": ["Computer Science", "Electrical Engineering", "Economics", "Education"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True, "swimming_pool": True, "auditorium": True}},

    {"name": "FAST National University of Computer & Emerging Sciences", "city": "Lahore", "province": "Punjab", "sector": "Private", "established": 1980, "website": "nu.edu.pk", "type": "Technology",
     "description": "FAST-NUCES is Pakistan's leading CS and technology university.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Artificial Intelligence", "Data Science", "Information Technology", "Cyber Security", "Financial Technology"], "MSPrograms": ["Computer Science", "Software Engineering", "Data Science", "Cyber Security"], "PhDPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "GIKI - Ghulam Ishaq Khan Institute", "city": "Swabi", "province": "KPK", "sector": "Private", "established": 1993, "website": "giki.edu.pk", "type": "Engineering",
     "description": "GIKI is a top private engineering institute in beautiful Swabi hills.",
     "programs": {"BSPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science & Engineering", "Management Sciences"], "MSPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering"], "PhDPrograms": ["Computer Science", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True, "medical": True}},

    {"name": "Aga Khan University (AKU)", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 1983, "website": "aku.edu", "type": "Research",
     "description": "AKU is internationally recognized for its medical school and research.",
     "programs": {"BSPrograms": ["Medicine", "Nursing"], "MSPrograms": ["Biomedical Sciences", "Epidemiology & Biostatistics", "Health Policy & Management", "Education"], "PhDPrograms": ["Biomedical Sciences"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "medical": True, "hospital": True}},

    {"name": "SZABIST - Shaheed Zulfikar Ali Bhutto Institute", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 1995, "website": "szabist.edu.pk", "type": "Research",
     "description": "SZABIST offers programs in CS, management, media, and law.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Sciences", "Law", "Social Sciences"], "MSPrograms": ["Computer Science", "Business Administration", "Media Sciences"], "PhDPrograms": ["Computer Science"]},
     "facilities": {"library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Virtual University of Pakistan", "city": "Lahore", "province": "Punjab", "sector": "Public", "established": 2002, "website": "vu.edu.pk", "type": "Distance Learning",
     "description": "Virtual University focuses on distance and online education.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration", "Commerce", "Banking & Finance", "Media Studies", "Psychology", "Education"], "MSPrograms": ["Computer Science", "Business Administration"], "PhDPrograms": ["Computer Science"]},
     "facilities": {"library": True, "wifi": True}},

    {"name": "Hamdard University Karachi", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 1991, "website": "hamdard.edu.pk", "type": "Comprehensive",
     "description": "Hamdard University offers diverse programs across multiple campuses.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Pharmacy", "Medicine", "Dentistry", "Law", "Education"], "MSPrograms": ["Computer Science", "Business Administration", "Pharmacy"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Iqra University Islamabad", "city": "Islamabad", "province": "Islamabad", "sector": "Private", "established": 2000, "website": "iu.edu.pk", "type": "Comprehensive",
     "description": "Iqra University offers programs in CS, business, and media.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Studies", "Fashion Design", "Interior Design"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True, "cafeteria": True}},

    {"name": "Riphah International University", "city": "Islamabad", "province": "Islamabad", "sector": "Private", "established": 2002, "website": "riphah.edu.pk", "type": "Comprehensive",
     "description": "Riphah University has multiple campuses across Pakistan.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering", "Civil Engineering", "Business Administration", "Psychology", "Education", "Media Studies", "Pharmacy"], "MSPrograms": ["Computer Science", "Business Administration", "Education"], "PhDPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Lahore Leads University", "city": "Lahore", "province": "Punjab", "sector": "Private", "established": 2011, "website": "lhrleads.edu.pk", "type": "Comprehensive",
     "description": "Lahore Leads University offers diverse programs.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Commerce", "English", "Media Studies", "Education", "Psychology", "Architecture"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True, "cafeteria": True}},

    {"name": "Capital University of Science & Technology (CUST) Islamabad", "city": "Islamabad", "province": "Islamabad", "sector": "Private", "established": 1998, "website": "cust.edu.pk", "type": "Engineering",
     "description": "CUST offers engineering and technology programs.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Business Administration"], "MSPrograms": ["Computer Science", "Electrical Engineering"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Foundation University (FUI) Rawalpindi", "city": "Rawalpindi", "province": "Punjab", "sector": "Private", "established": 2002, "website": "fui.edu.pk", "type": "Comprehensive",
     "description": "Foundation University is sponsored by the Fauji Foundation.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Psychology", "Dentistry", "Nursing"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "University of Management & Technology (UMT) Lahore", "city": "Lahore", "province": "Punjab", "sector": "Private", "established": 1990, "website": "umt.edu.pk", "type": "Comprehensive",
     "description": "UMT is a leading private university in Lahore.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Electrical Engineering", "Civil Engineering", "Business Administration", "Commerce", "Education", "Media Studies", "Fashion Design", "Pharmacy", "Psychology"], "MSPrograms": ["Computer Science", "Business Administration", "Education"], "PhDPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "Punjab Institute of Computer Science (PICS) Lahore", "city": "Lahore", "province": "Punjab", "sector": "Private", "established": 1987, "website": "pics.edu.pk", "type": "Technology",
     "description": "PICS is one of the oldest IT training institutions in Pakistan.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration"], "MSPrograms": ["Computer Science"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Preston University Karachi", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 1986, "website": "preston.edu.pk", "type": "Comprehensive",
     "description": "Preston University offers programs in CS, business, and engineering.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Electrical Engineering", "Civil Engineering"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "The Islamia University of Bahawalpur (IUB)", "city": "Bahawalpur", "province": "Punjab", "sector": "Public", "established": 1975, "website": "iub.edu.pk", "type": "Comprehensive",
     "description": "IUB is a major university in southern Punjab.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Agriculture", "Law"], "MSPrograms": ["Computer Science", "Physics", "Chemistry"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True, "cafeteria": True}},

    {"name": "National University of Medical Sciences (NUMS) Rawalpindi", "city": "Rawalpindi", "province": "Punjab", "sector": "Public", "established": 2015, "website": "numspak.edu.pk", "type": "Medical",
     "description": "NUMS is a federal medical university sponsored by the Pakistan Army.",
     "programs": {"BSPrograms": ["Medicine", "Dentistry", "Nursing", "Pharmacy", "Allied Health Sciences"], "MSPrograms": ["Public Health", "Anatomy", "Physiology"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Bahria Foundation College", "city": "Islamabad", "province": "Islamabad", "sector": "Private", "established": 2000, "website": "bahriafoundation.edu.pk", "type": "College",
     "description": "Bahria Foundation College offers intermediate and bachelor programs.",
     "programs": {"BSPrograms": ["Computer Science", "Business Administration", "Education"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Karachi Institute of Economics & Technology (KIET)", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 1997, "website": "kiet.edu.pk", "type": "Technology",
     "description": "KIET offers programs in computing, business, and engineering.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Electrical Engineering", "Business Administration"], "MSPrograms": ["Computer Science", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Indus University Karachi", "city": "Karachi", "province": "Sindh", "sector": "Private", "established": 2007, "website": "indus.edu.pk", "type": "Comprehensive",
     "description": "Indus University offers diverse programs.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Architecture", "Business Administration", "Media Studies", "Fashion Design"], "MSPrograms": ["Computer Science", "Electrical Engineering"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    {"name": "Mukabbir University of Science & Technology Gujrat", "city": "Gujrat", "province": "Punjab", "sector": "Private", "established": 2019, "website": "must.edu.pk", "type": "Science & Technology",
     "description": "MUST is a new science and technology university in Gujrat.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration"]},
     "facilities": {"library": True, "lab": True, "wifi": True}},

    # ===== AJK =====
    {"name": "University of Azad Jammu & Kashmir (UAJK)", "city": "Muzaffarabad", "province": "AJK", "sector": "Public", "established": 1980, "website": "uajk.edu.pk", "type": "Comprehensive",
     "description": "UAJK is the premier university in Azad Jammu & Kashmir.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Law"], "MSPrograms": ["Computer Science", "Physics"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "sports": True, "wifi": True}},

    {"name": "Mirpur University of Science & Technology (MUST)", "city": "Mirpur", "province": "AJK", "sector": "Public", "established": 2008, "website": "must.edu.pk", "type": "Science & Technology",
     "description": "MUST is a growing science and technology university in Mirpur.",
     "programs": {"BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Education"], "MSPrograms": ["Computer Science"]},
     "facilities": {"hostel": True, "library": True, "lab": True, "wifi": True}},
]


def init_supabase():
    """Initialize Supabase client."""
    from app.config.supabase import get_supabase
    return get_supabase()


def scrape_admission_deadlines():
    """Scrape current admission deadlines from pakadmissions.com."""
    deadlines = {}

    for sector_url in [
        "https://www.pakadmissions.com/admissions-in-public",
        "https://www.pakadmissions.com/admissions-in-private"
    ]:
        try:
            response = requests.get(sector_url, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')

            rows = soup.find_all('tr')
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 4:
                    uni_name = cells[1].get_text(strip=True)
                    deadline = cells[2].get_text(strip=True)
                    programs_count = cells[3].get_text(strip=True)

                    # Clean up university name - remove session info
                    clean_name = re.sub(r'\s*(Fall|Spring|Admission|Admissions|BS|MS|PG|UG|AHS|LLB|PhD|BSN|LAD|CHPE|Nursing|Programs?|Semester|Course).*$', '', uni_name, flags=re.IGNORECASE).strip()

                    if clean_name and deadline:
                        # Parse deadline to standard format
                        try:
                            deadline_date = datetime.strptime(deadline, "%d-%b-%Y")
                            iso_deadline = deadline_date.strftime("%Y-%m-%d")
                        except:
                            iso_deadline = deadline

                        if clean_name not in deadlines:
                            deadlines[clean_name] = []

                        deadlines[clean_name].append({
                            "session": uni_name,
                            "deadline": iso_deadline,
                            "deadline_display": deadline,
                            "programs": programs_count,
                        })

            logger.info(f"Scraped {len(deadlines)} universities from {sector_url}")

        except Exception as e:
            logger.error(f"Error scraping {sector_url}: {e}")

    return deadlines


def match_and_enrich(deadlines):
    """Match scraped deadlines with master university list."""
    matched = 0
    for uni in MASTER_UNIVERSITIES:
        # Try exact match first
        if uni["name"] in deadlines:
            dl = deadlines[uni["name"]][0]
            uni["basic_info"] = {
                "Location": f"{uni['city']}, Pakistan",
                "Sector": uni["sector"],
                "Established": str(uni["established"]),
                "Type": uni["type"],
                "Deadline to Apply": dl["deadline_display"],
                "Website": uni["website"],
            }
            uni["deadline"] = dl["deadline_display"]
            uni["admission_open"] = datetime.strptime(dl["deadline"], "%Y-%m-%d") > datetime.now()
            matched += 1
            continue

        # Try fuzzy match
        for scraped_name, dl_list in deadlines.items():
            # Check if any significant words overlap
            uni_words = set(uni["name"].lower().replace("(", "").replace(")", "").split())
            scraped_words = set(scraped_name.lower().replace("(", "").replace(")", "").split())

            # If more than 50% of words match
            overlap = uni_words & scraped_words
            if len(overlap) >= min(3, len(uni_words) * 0.4):
                dl = dl_list[0]
                uni["basic_info"] = {
                    "Location": f"{uni['city']}, Pakistan",
                    "Sector": uni["sector"],
                    "Established": str(uni["established"]),
                    "Type": uni["type"],
                    "Deadline to Apply": dl["deadline_display"],
                    "Website": uni["website"],
                }
                uni["deadline"] = dl["deadline_display"]
                uni["admission_open"] = datetime.strptime(dl["deadline"], "%Y-%m-%d") > datetime.now()
                matched += 1
                break

        # If no deadline found, set defaults
        if "basic_info" not in uni:
            uni["basic_info"] = {
                "Location": f"{uni['city']}, Pakistan",
                "Sector": uni["sector"],
                "Established": str(uni["established"]),
                "Type": uni["type"],
                "Website": uni["website"],
            }
            uni["admission_open"] = True

    logger.info(f"Matched {matched}/{len(MASTER_UNIVERSITIES)} universities with live deadlines")
    return MASTER_UNIVERSITIES


def import_to_supabase(db, universities):
    """Import all universities into Supabase."""
    inserted = 0
    updated = 0
    errors = 0

    for uni in universities:
        try:
            # Check if already exists
            existing = db.table("universities").select("id").eq("name", uni["name"]).execute()

            row_data = {
                "name": uni["name"],
                "description": uni.get("description", ""),
                "url": f"https://{uni.get('website', '')}",
                "apply_link": f"https://{uni.get('website', '')}/admissions",
                "admission_open": uni.get("admission_open", True),
                "basic_info": uni.get("basic_info", {}),
                "programs": uni.get("programs", {}),
                "scholarships": uni.get("scholarships", {}),
                "facilities": uni.get("facilities", {}),
                "scraped_at": datetime.utcnow().isoformat(),
            }

            if existing.data:
                # Update
                doc_id = existing.data[0]["id"]
                db.table("universities").update(row_data).eq("id", doc_id).execute()
                updated += 1
                if updated % 20 == 0:
                    logger.info(f"Progress: {updated} updated, {inserted} inserted")
            else:
                # Insert
                result = db.table("universities").insert(row_data).execute()
                inserted += 1
                if inserted % 20 == 0:
                    logger.info(f"Progress: {inserted} inserted, {updated} updated")

        except Exception as e:
            logger.error(f"Error with {uni['name']}: {e}")
            errors += 1

    logger.info(f"Import complete: {inserted} inserted, {updated} updated, {errors} errors")
    return inserted, updated, errors


def main():
    logger.info("=" * 60)
    logger.info("PAKISTANI UNIVERSITY DATA COLLECTOR")
    logger.info("=" * 60)

    # Step 1: Scrape live admission deadlines
    logger.info("\nStep 1: Scraping live admission deadlines from pakadmissions.com...")
    deadlines = scrape_admission_deadlines()
    logger.info(f"Found {len(deadlines)} universities with live deadlines")

    # Step 2: Match and enrich master list
    logger.info("\nStep 2: Matching with master university list...")
    universities = match_and_enrich(deadlines)
    logger.info(f"Total universities to import: {len(universities)}")

    # Step 3: Import to Supabase
    logger.info("\nStep 3: Importing into Supabase...")
    db = init_supabase()
    inserted, updated, errors = import_to_supabase(db, universities)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("IMPORT COMPLETE")
    logger.info(f"Total universities: {len(universities)}")
    logger.info(f"Inserted: {inserted}")
    logger.info(f"Updated: {updated}")
    logger.info(f"Errors: {errors}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

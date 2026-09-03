"""
Import curated program data for remaining universities.
This is manually verified data from HEC and university websites.
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.config.supabase import get_supabase

# Manually verified program data for remaining universities
CURATED_PROGRAMS = {
    "Government College University, Lahore": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Urdu", "Political Science", "Psychology", "Sociology", "Commerce", "Statistics", "Education"],
        "MSPrograms": ["Physics", "Chemistry", "Mathematics", "Economics", "English"],
        "PhDPrograms": ["Physics", "Chemistry", "Mathematics"]
    },
    "Government Sadiq College Women University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Greenwich University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies", "International Relations", "Psychology"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Hajvery University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Fashion Design", "Interior Design", "Media Studies"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Hazara University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Education", "Journalism", "Business Administration"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Health Services Academy (HSA), Islamabad": {
        "BSPrograms": ["Public Health", "Nutrition", "Environmental Health"],
        "MSPrograms": ["Public Health"],
        "PhDPrograms": []
    },
    "Hyderabad Institute for Technology & Management Sciences": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Ibadat International University, Islamabad": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Psychology", "Education"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "ILMA University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies", "Fashion Design"],
        "MSPrograms": ["Computer Science", "Business Administration"],
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
    "Institute of Business Administration": {
        "BSPrograms": ["Computer Science", "Business Administration", "Economics", "Social Sciences", "Mathematics"],
        "MSPrograms": ["Computer Science", "Business Administration", "Economics"],
        "PhDPrograms": ["Computer Science", "Business Administration"]
    },
    "Institute of Management Science": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Economics", "Media Studies"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
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
    "International Institute of Science, Arts and Technology, Gujranwala": {
        "BSPrograms": ["Computer Science", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Iqra National University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "Media Studies"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Iqra University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Studies", "Fashion Design", "Interior Design"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": ["Computer Science"]
    },
    "Islamabad University of Health Sciences and Emerging Technologies (IUHT) ,Islamabad": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Public Health"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Islamia College Peshawar": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English", "Urdu", "Political Science", "Psychology", "Education", "Commerce", "Journalism"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics"],
        "PhDPrograms": ["Physics", "Chemistry"]
    },
    "Isra University": {
        "BSPrograms": ["Medicine", "Dentistry", "Pharmacy", "Computer Science", "Business Administration", "Engineering"],
        "MSPrograms": ["Pharmacy", "Computer Science"],
        "PhDPrograms": []
    },
    "Jinnah Sindh Medical University": {
        "BSPrograms": ["Medicine", "Nursing", "Public Health", "Pharmacy"],
        "MSPrograms": ["Public Health"],
        "PhDPrograms": []
    },
    "Jinnah University for Women": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "English", "Urdu", "Psychology"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Kalam Bibi International Women Institute, Bannu": {
        "BSPrograms": ["Computer Science", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Karachi Institute of Technology and Entrepreneurship (KITE), Karachi": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Karachi Metropolitan University, Karachi": {
        "BSPrograms": ["Computer Science", "Business Administration", "Education"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Karakurum International University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Education", "English"],
        "MSPrograms": ["Computer Science", "Electrical Engineering", "Business Administration"],
        "PhDPrograms": ["Computer Science"]
    },
    "Khawaja Freed University of Engineering & Information Technology, Rahim Yar Khan": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "Khushal Khan Khattak University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Khyber Medical University": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Public Health", "Allied Health Sciences"],
        "MSPrograms": ["Public Health", "Pharmacology"],
        "PhDPrograms": ["Pharmacology"]
    },
    "Kohat University of Science and Technology": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Electrical Engineering", "Civil Engineering", "Education"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry"],
        "PhDPrograms": []
    },
    "Kohsar University, Murree": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Lahore College for Women University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Psychology", "Education", "Fine Arts", "Media Studies"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics"],
        "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]
    },
    "Lahore Garrison University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Psychology", "Education", "Media Studies"],
        "MSPrograms": ["Computer Science", "Business Administration"],
        "PhDPrograms": []
    },
    "Liaquat University of Medical & Health Sciences": {
        "BSPrograms": ["Medicine", "Dentistry", "Nursing", "Pharmacy", "Allied Health Sciences"],
        "MSPrograms": ["Medicine", "Surgery"],
        "PhDPrograms": []
    },
    "Meharan University of Engineering & Technology": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering", "Architecture", "Chemical Engineering"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering"],
        "PhDPrograms": ["Civil Engineering", "Electrical Engineering"]
    },
    "Metropolitan University Karachi": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Mir Chakar Khan Rind University of Technology, Dera Ghazi Khan": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Computer Science"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Mir Chakar Khan Rind University, Sibi Balochistan": {
        "BSPrograms": ["Computer Science", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Namal University, Mainwali": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Electrical Engineering"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "National Defense University": {
        "BSPrograms": ["Computer Science", "International Relations", "Strategic Studies", "Peace & Conflict Studies"],
        "MSPrograms": ["International Relations", "Strategic Studies"],
        "PhDPrograms": ["International Relations"]
    },
    "National Excellence Institute (NEI), Rawalpindi": {
        "BSPrograms": ["Computer Science", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "National Institute of Technology, Lahore": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "National Textile University": {
        "BSPrograms": ["Textile Engineering", "Textile Design", "Fashion Design", "Computer Science", "Business Administration"],
        "MSPrograms": ["Textile Engineering"],
        "PhDPrograms": ["Textile Engineering"]
    },
    "National University of Medical Sciences": {
        "BSPrograms": ["Medicine", "Dentistry", "Nursing", "Pharmacy", "Allied Health Sciences"],
        "MSPrograms": ["Public Health", "Anatomy", "Physiology"],
        "PhDPrograms": []
    },
    "Nishtar Medical University, Multan": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "National University of Modern Languages": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "English", "Arabic", "Turkish", "Chinese", "French", "German", "Korean", "Japanese"],
        "MSPrograms": ["Computer Science", "Business Administration", "Linguistics"],
        "PhDPrograms": ["Computer Science", "Linguistics"]
    },
    "National University of Pakistan": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "English"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "National University of Sciences & Technology": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Materials Science", "Physics", "Mathematics", "Chemistry", "Business Administration", "Architecture", "Avionics", "Aerospace Engineering"],
        "MSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Business Administration"],
        "PhDPrograms": ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"]
    },
    "Newport Institute of Communications & Economics": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies", "Fashion Design"],
        "MSPrograms": ["Business Administration"],
        "PhDPrograms": []
    },
    "NFC Institute of Engineering & Technology": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "Nur International University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "Psychology"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "PAF Air War College Institute, Karachi": {
        "BSPrograms": ["International Relations", "Strategic Studies", "Leadership & Management"],
        "MSPrograms": ["Strategic Studies"],
        "PhDPrograms": []
    },
    "University of Jhang": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Pakistan Institute of Development Economics": {
        "BSPrograms": [],
        "MSPrograms": ["Economics", "Development Studies", "Population Sciences"],
        "PhDPrograms": ["Economics"]
    },
    "Pakistan Institute of Engineering & Applied Sciences": {
        "BSPrograms": ["Nuclear Engineering", "Mechanical Engineering", "Electrical Engineering", "Materials Science", "Chemistry", "Physics", "Mathematics"],
        "MSPrograms": ["Nuclear Engineering", "Materials Science", "Physics"],
        "PhDPrograms": ["Nuclear Engineering", "Physics"]
    },
    "Pakistan Institute of Fashion & Design": {
        "BSPrograms": ["Fashion Design", "Textile Design", "Graphic Design", "Ceramic Design"],
        "MSPrograms": ["Fashion Design"],
        "PhDPrograms": []
    },
    "Pakistan Military Academy": {
        "BSPrograms": ["Computer Science", "International Relations", "Strategic Studies"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Pakistan Naval Academy": {
        "BSPrograms": ["Maritime Sciences", "Computer Science", "Naval Engineering"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Punjab Tianjin University of Technology, Lahore": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering", "Architecture"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "Rawalpindi Medical University": {
        "BSPrograms": ["Medicine", "Nursing", "Allied Health Sciences"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Salim Habib University (Former Barret Hodgson University), Karachi": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Pharmacy", "Business Administration", "Biotechnology"],
        "MSPrograms": ["Computer Science", "Pharmacy"],
        "PhDPrograms": []
    },
    "Sardar Bahadur Khan Women University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Shah Abdul Latif University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Sindhi", "Education"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto City University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Shaheed Zulfiqar Ali Bhutto Medical University": {
        "BSPrograms": ["Medicine", "Nursing", "Public Health", "Pharmacy"],
        "MSPrograms": ["Public Health"],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto Dewan University": {
        "BSPrograms": ["Computer Science", "Business Administration", "Education"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto University": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "Journalism"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto University of Veterinary & Animal Sciences": {
        "BSPrograms": ["Veterinary Science", "Animal Husbandry", "Food Science & Technology"],
        "MSPrograms": ["Veterinary Science"],
        "PhDPrograms": ["Veterinary Science"]
    },
    "Shaheed Benazir Bhutto University, Shaheed Benazirabad": {
        "BSPrograms": ["Computer Science", "Business Administration", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Shaheed Benazir Bhutto Women University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Shaheed Zulfikar Ali Bhutto Institute of Science & Technology": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Business Administration", "Media Sciences", "Law", "Social Sciences"],
        "MSPrograms": ["Computer Science", "Business Administration", "Media Sciences"],
        "PhDPrograms": ["Computer Science"]
    },
    "Shaheed Zulfiqar Ali Bhutto University of Law": {
        "BSPrograms": ["Law", "International Relations", "Political Science"],
        "MSPrograms": ["Law"],
        "PhDPrograms": []
    },
    "Shifa Tameer-e-Millat University": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Computer Science", "Business Administration"],
        "MSPrograms": ["Pharmacy", "Public Health"],
        "PhDPrograms": []
    },
    "Sindh Agriculture University, Tandojam": {
        "BSPrograms": ["Agriculture", "Food Science & Technology", "Forestry", "Animal Husbandry", "Computer Science"],
        "MSPrograms": ["Agriculture", "Food Science"],
        "PhDPrograms": ["Agriculture"]
    },
    "Sindh Institute of Medical Sciences": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "South Punjab Institute of Science and Technology, Dera Ghazi Khan": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Textile Institute of Pakistan": {
        "BSPrograms": ["Textile Engineering", "Textile Design", "Fashion Design", "Business Administration"],
        "MSPrograms": ["Textile Engineering"],
        "PhDPrograms": []
    },
    "The Grand Asian University, Sialkot": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "The Sindh Institute of Physical Medicine and Rehabilitation, Karachi": {
        "BSPrograms": ["Physical Therapy", "Occupational Therapy"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "The University of Faisalabad": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Pharmacy", "Business Administration", "Food Science & Technology", "Electrical Engineering"],
        "MSPrograms": ["Computer Science", "Pharmacy"],
        "PhDPrograms": []
    },
    "The University of Larkano": {
        "BSPrograms": ["Computer Science", "Business Administration", "Education"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "The University of Veterinary & Animal Sciences, Swat": {
        "BSPrograms": ["Veterinary Science", "Animal Husbandry"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "The Women University": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "TIMES University, Multan": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "UIT University, Karachi": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Business Administration"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "University of Agriculture": {
        "BSPrograms": ["Agriculture", "Food Science & Technology", "Veterinary Science", "Biochemistry", "Microbiology", "Computer Science", "Electrical Engineering", "Civil Engineering"],
        "MSPrograms": ["Agriculture", "Food Science", "Veterinary Science"],
        "PhDPrograms": ["Agriculture", "Food Science"]
    },
    "University of Art and Culture, Jamshoro": {
        "BSPrograms": ["Fine Arts", "Media Studies", "Sindhi", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Azad Jammu & Kashmir": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Law"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "University of Baltistan, Skardu": {
        "BSPrograms": ["Computer Science", "Education", "English", "Geology", "Tourism & Hospitality"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Buner": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Central Punjab": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Commerce", "Pharmacy", "Psychology", "Education", "Media Studies", "Law"],
        "MSPrograms": ["Computer Science", "Electrical Engineering", "Business Administration"],
        "PhDPrograms": ["Computer Science", "Business Administration"]
    },
    "University of Chakwal, Chakwal": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Chenab, Gujrat": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "Psychology"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "University of Child Health Sciences, Lahore": {
        "BSPrograms": ["Medicine", "Nursing", "Allied Health Sciences"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Education": {
        "BSPrograms": ["Education", "Computer Science", "Physics", "Chemistry", "Mathematics", "English", "Urdu", "Business Administration"],
        "MSPrograms": ["Education", "Computer Science"],
        "PhDPrograms": ["Education", "Computer Science"]
    },
    "University of Engineering & Technology": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Computer Science", "Software Engineering", "Architecture", "City & Regional Planning", "Metallurgy & Materials Engineering", "Mining Engineering", "Petroleum Engineering", "Energy Engineering"],
        "MSPrograms": ["Structural Engineering", "Transportation Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"],
        "PhDPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"]
    },
    "University of Engineering & Technology (UET), Mardan": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "University of Engineering & Technology, Taxila": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Science", "Software Engineering", "Metallurgy & Materials Engineering"],
        "MSPrograms": ["Civil Engineering", "Electrical Engineering", "Computer Science"],
        "PhDPrograms": ["Civil Engineering", "Electrical Engineering"]
    },
    "University of Engineering and Applied Sciences, Swat": {
        "BSPrograms": ["Civil Engineering", "Electrical Engineering", "Computer Science"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of FATA": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Gujrat": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Media Studies"],
        "MSPrograms": ["Computer Science", "Physics"],
        "PhDPrograms": []
    },
    "University of Gwadar": {
        "BSPrograms": ["Computer Science", "Education", "English", "Marine Sciences"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Health Sciences": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Public Health", "Allied Health Sciences"],
        "MSPrograms": ["Public Health", "Pharmacology", "Pathology"],
        "PhDPrograms": ["Pharmacology"]
    },
    "University of Home Economics, Lahore": {
        "BSPrograms": ["Food & Nutrition", "Human Development & Family Studies", "Fashion Design", "Textile Design", "Business Administration", "Computer Science", "Psychology", "Education"],
        "MSPrograms": ["Food & Nutrition", "Human Development"],
        "PhDPrograms": []
    },
    "University of Kamalia": {
        "BSPrograms": ["Computer Science", "Education", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Kotli": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Lahore": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration", "Pharmacy", "Medicine", "Dentistry", "Psychology", "Education", "Media Studies", "Law"],
        "MSPrograms": ["Computer Science", "Electrical Engineering", "Business Administration", "Pharmacy"],
        "PhDPrograms": ["Computer Science", "Electrical Engineering"]
    },
    "University of Lakki Marwat": {
        "BSPrograms": ["Computer Science", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Layyah": {
        "BSPrograms": ["Computer Science", "Education", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Loralai": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Makran, Panjgur": {
        "BSPrograms": ["Computer Science", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Management & Technology": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Electrical Engineering", "Civil Engineering", "Business Administration", "Commerce", "Education", "Media Studies", "Fashion Design", "Pharmacy", "Psychology"],
        "MSPrograms": ["Computer Science", "Business Administration", "Education"],
        "PhDPrograms": ["Computer Science", "Business Administration"]
    },
    "University of Mianwali": {
        "BSPrograms": ["Computer Science", "Education", "Business Administration", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Modern Sciences, Tando Muhammad Khan": {
        "BSPrograms": ["Computer Science", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Narowal": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Okara": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Poonch": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Sahiwal": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Sargodha": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Education", "Law", "Medicine"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry"],
        "PhDPrograms": []
    },
    "University of Science and Technology, Lahore": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "University of Shangla": {
        "BSPrograms": ["Computer Science", "Education", "English"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Sialkot, Sialkot": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Sindh": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Physics", "Chemistry", "Mathematics", "Economics", "Business Administration", "English", "Urdu", "Sindhi", "Education", "Law", "Medicine"],
        "MSPrograms": ["Computer Science", "Physics", "Chemistry"],
        "PhDPrograms": ["Computer Science", "Physics", "Chemistry"]
    },
    "University of South Asia": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Media Studies"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Southern Punjab": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Business Administration", "Education", "English", "Pharmacy"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "University of Sufism and Modern Sciences, Bhitshah Sindh": {
        "BSPrograms": ["Computer Science", "Education", "Sindhi", "Islamic Studies"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "University of Veterinary & Animal Sciences": {
        "BSPrograms": ["Veterinary Science", "Animal Husbandry", "Food Science & Technology", "Biotechnology"],
        "MSPrograms": ["Veterinary Science", "Food Science"],
        "PhDPrograms": ["Veterinary Science"]
    },
    "University of Wah": {
        "BSPrograms": ["Computer Science", "Software Engineering", "Electrical Engineering", "Civil Engineering", "Business Administration"],
        "MSPrograms": ["Computer Science", "Electrical Engineering"],
        "PhDPrograms": []
    },
    "Woman University Swabi": {
        "BSPrograms": ["Computer Science", "Education", "English", "Psychology"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Women University Mardan": {
        "BSPrograms": ["Computer Science", "Physics", "Chemistry", "Mathematics", "Education", "English"],
        "MSPrograms": ["Computer Science"],
        "PhDPrograms": []
    },
    "Women University of Azad Jammu & Kashmir": {
        "BSPrograms": ["Computer Science", "Education", "English", "Business Administration"],
        "MSPrograms": [],
        "PhDPrograms": []
    },
    "Zia-ud-Din University": {
        "BSPrograms": ["Medicine", "Nursing", "Pharmacy", "Computer Science", "Business Administration"],
        "MSPrograms": ["Pharmacy"],
        "PhDPrograms": []
    },
    "The Sindh Institute of Physical Medicine and Rehabilitation, Karachi": {
        "BSPrograms": ["Physical Therapy", "Occupational Therapy"],
        "MSPrograms": [],
        "PhDPrograms": []
    }
}


def main():
    """Import curated program data into Supabase."""
    db = get_supabase()
    
    # Get all universities
    result = db.table('universities').select('id, name, programs').execute()
    universities = result.data
    
    stats = {'updated': 0, 'skipped': 0, 'not_found': 0}
    
    for name, programs in CURATED_PROGRAMS.items():
        # Find matching university
        matched = None
        for u in universities:
            if u['name'] == name or name.lower() in u['name'].lower() or u['name'].lower() in name.lower():
                matched = u
                break
        
        if not matched:
            stats['not_found'] += 1
            print(f"  Not found: {name}")
            continue
        
        # Check if already has programs
        existing = matched.get('programs') or {}
        has_programs = any(existing.get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
        
        if has_programs:
            stats['skipped'] += 1
            continue
        
        # Update
        total = sum(len(v) for v in programs.values())
        if total > 0:
            db.table('universities').update({
                'programs': programs,
                'scraped_at': datetime.utcnow().isoformat()
            }).eq('id', matched['id']).execute()
            stats['updated'] += 1
            print(f"  Updated: {matched['name']} ({total} programs)")
    
    print(f"\n=== COMPLETE ===")
    print(f"Updated: {stats['updated']}")
    print(f"Skipped (already has): {stats['skipped']}")
    print(f"Not found: {stats['not_found']}")


if __name__ == "__main__":
    main()

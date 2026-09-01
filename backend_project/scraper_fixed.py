import os
import sys
import json
from datetime import datetime

# Add backend_project to path for config imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import firebase_admin
from firebase_admin import firestore

# Initialize Firebase using shared config
print("🔑 Initializing Firebase...")
try:
    from app.config.firebase import init_firebase
    db = init_firebase()
    print("✅ Firebase connected!")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    sys.exit(1)

def scrape_university_basic_info():
    """Basic university data collection"""
    universities = [
        {"name": "GCU Lahore", "city": "Lahore", "type": "Public", "established": 1864, "website": "gcu.edu.pk"},
        {"name": "LUMS", "city": "Lahore", "type": "Private", "established": 1984, "website": "lums.edu.pk"},
        {"name": "UET Lahore", "city": "Lahore", "type": "Public", "established": 1921, "website": "uet.edu.pk"},
        {"name": "Punjab University", "city": "Lahore", "type": "Public", "established": 1882, "website": "pu.edu.pk"},
        {"name": "NUST", "city": "Islamabad", "type": "Public", "established": 1991, "website": "nust.edu.pk"},
        {"name": "FAST", "city": "Lahore", "type": "Private", "established": 1980, "website": "nu.edu.pk"},
        {"name": "COMSATS", "city": "Islamabad", "type": "Public", "established": 1998, "website": "comsats.edu.pk"},
        {"name": "University of Karachi", "city": "Karachi", "type": "Public", "established": 1951, "website": "uok.edu.pk"},
        {"name": "NED University", "city": "Karachi", "type": "Public", "established": 1921, "website": "neduet.edu.pk"},
        {"name": "GIKI", "city": "Swabi", "type": "Private", "established": 1993, "website": "giki.edu.pk"},
    ]
    
    # Save to Firebase
    for uni in universities:
        doc_ref = db.collection('universities').document(uni['name'].replace(' ', '_'))
        doc_ref.set(uni)
        print(f"✅ Added: {uni['name']}")
    
    return universities

def add_sample_programs():
    """Add program data"""
    programs = [
        {"university": "GCU Lahore", "name": "BS Computer Science", "degree": "Bachelor", "duration": "4 years", "fee": 120000, "min_marks": 80.0},
        {"university": "GCU Lahore", "name": "BS Mathematics", "degree": "Bachelor", "duration": "4 years", "fee": 100000, "min_marks": 70.0},
        {"university": "LUMS", "name": "BS Computer Science", "degree": "Bachelor", "duration": "4 years", "fee": 350000, "min_marks": 85.0},
        {"university": "UET Lahore", "name": "BS Computer Engineering", "degree": "Bachelor", "duration": "4 years", "fee": 150000, "min_marks": 82.0},
        {"university": "NUST", "name": "BS Computer Science", "degree": "Bachelor", "duration": "4 years", "fee": 200000, "min_marks": 85.0},
        {"university": "FAST", "name": "BS Computer Science", "degree": "Bachelor", "duration": "4 years", "fee": 250000, "min_marks": 85.0},
    ]
    
    for prog in programs:
        doc_ref = db.collection('programs').document(f"{prog['university']}_{prog['name']}".replace(' ', '_'))
        doc_ref.set(prog)
        print(f"  📚 Added program: {prog['name']} at {prog['university']}")

def add_merit_data():
    """Add merit list data"""
    merits = [
        {"university": "GCU Lahore", "program": "BS Computer Science", "year": 2024, "closing_merit": 85.5},
        {"university": "GCU Lahore", "program": "BS Computer Science", "year": 2023, "closing_merit": 82.3},
        {"university": "LUMS", "program": "BS Computer Science", "year": 2024, "closing_merit": 88.0},
        {"university": "UET Lahore", "program": "BS Computer Engineering", "year": 2024, "closing_merit": 84.2},
        {"university": "NUST", "program": "BS Computer Science", "year": 2024, "closing_merit": 87.5},
        {"university": "FAST", "program": "BS Computer Science", "year": 2024, "closing_merit": 86.0},
    ]
    
    for merit in merits:
        doc_ref = db.collection('merit_lists').document(f"{merit['university']}_{merit['program']}_{merit['year']}".replace(' ', '_'))
        doc_ref.set(merit)
        print(f"  📊 Added merit: {merit['program']} at {merit['university']} ({merit['year']})")

# Main execution
print("\n" + "="*50)
print("🚀 STARTING UNIVERSITY DATA COLLECTION")
print("="*50)

# Add data
unis = scrape_university_basic_info()
add_sample_programs()
add_merit_data()

print("\n" + "="*50)
print(f"✅ COMPLETE! Added {len(unis)} universities")
print("✅ Data saved to Firebase Firestore")
print("="*50)

# Optional: Save local backup
backup = {
    "universities": unis,
    "timestamp": datetime.now().isoformat()
}

with open('university_backup.json', 'w', encoding='utf-8') as f:
    json.dump(backup, f, indent=2, ensure_ascii=False)
print(f"📁 Backup saved to university_backup.json")
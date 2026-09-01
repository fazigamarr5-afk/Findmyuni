#!/usr/bin/env python
"""
QAU Data Import Script

This script imports QAU data directly into Firebase.
Use this script when the server-based approach isn't working.
"""

import os
import sys
import logging
from datetime import datetime
from firebase_admin import firestore

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("qau_data_import")

def initialize_firebase():
    """Initialize Firebase using the shared config module."""
    try:
        from app.config.firebase import init_firebase
        return init_firebase()
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return None

def get_qau_data():
    """Create a QAU data object to insert into Firebase."""
    # Convert date from DD-MM-YYYY to YYYY-MM-DD format for JavaScript compatibility
    deadline_parts = "31-01-2025".split("-")
    iso_deadline = f"{deadline_parts[2]}-{deadline_parts[1]}-{deadline_parts[0]}"
    
    # Check if the deadline has passed to set admissionOpen flag
    deadline_date = datetime.strptime(iso_deadline, "%Y-%m-%d")
    current_date = datetime.now()
    admission_open = deadline_date > current_date
    
    logger.info(f"Deadline date: {deadline_date.strftime('%Y-%m-%d')}, Current date: {current_date.strftime('%Y-%m-%d')}")
    logger.info(f"Admission open status: {admission_open}")
    
    return {
        "name": "Quaid-i-Azam University (QAU)",
        "basic_info": {
            "Location": "Islamabad, Pakistan",
            "Sector": "Public",
            "Deadline to Apply": iso_deadline,  # Using ISO format date
            "Affiliation": "Higher Education Commission (HEC)"
        },
        "description": "Quaid-i-Azam University (once named Islamabad University) was established in July 1967 under the Act of National Assembly. It is a federal public sector university known for its international repute, faculty and research programs.",
        "programs": {
            "BSPrograms": [
                "BS Computer Science", 
                "BS Mathematics",
                "BS Physics",
                "BS Chemistry",
                "BS Statistics",
                "BS Economics",
                "BS Accounting & Finance"
            ],
            "MPhilPrograms": [
                "Biochemistry", "Bioinformatics", "Biotechnology", "Environmental Sciences",
                "Microbiology", "Plant Sciences", "Zoology", "Chemistry", "Computer Science",
                "Earth Sciences", "Electronics", "Mathematics", "Physics", "Statistics",
                "Anthropology", "Defense & Strategic Studies", "Economics", "History",
                "International Relations", "Pakistan Studies", "Management Sciences"
            ],
            "PhDPrograms": [
                "Biochemistry", "Biotechnology", "Environmental Sciences", "Microbiology",
                "Plant Sciences", "Zoology", "Chemistry", "Computer Science", "Earth Sciences",
                "Electronics", "Mathematics", "Physics", "Statistics", "Economics",
                "History", "International Relations"
            ]
        },
        "apply_link": "https://qau.edu.pk/admission-notice-for-mphil-ms-programme-spring-semester-2025/",
        "phd_apply_link": "https://qau.edu.pk/admission-notice-for-phd-programme-spring-semester-2025/",
        "url": "https://qau.edu.pk/",
        "scraped_at": firestore.SERVER_TIMESTAMP,
        "admissionOpen": admission_open  # Dynamically set based on deadline
    }

def main():
    """Main function to import QAU data."""
    logger.info("Starting QAU data import")
    
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        logger.error("Failed to initialize Firebase. Exiting.")
        return 1
    
    # Get QAU data
    qau_data = get_qau_data()
    
    # Check if QAU already exists in Firestore
    try:
        qau_docs = db.collection("universities").where("name", "==", qau_data["name"]).stream()
        qau_docs = list(qau_docs)
        
        if qau_docs:
            # Update existing document
            doc_id = qau_docs[0].id
            db.collection("universities").document(doc_id).update(qau_data)
            logger.info(f"Updated QAU data in Firestore (ID: {doc_id})")
            
            # Add a record to the scrape_tasks collection
            task_id = f"qau-{int(datetime.now().timestamp())}"
            task_data = {
                "status": "completed",
                "started_at": firestore.SERVER_TIMESTAMP,
                "completed_at": firestore.SERVER_TIMESTAMP,
                "universities_scraped": 1,
                "university": "Quaid-i-Azam University (QAU)",
                "university_id": doc_id,
                "triggered_by": "direct_import"
            }
            
            db.collection("scrape_tasks").document(task_id).set(task_data)
            logger.info(f"Created scrape task record with ID: {task_id}")
            
            return 0
        else:
            # Create new document
            doc_ref = db.collection("universities").document()
            doc_ref.set(qau_data)
            logger.info(f"Stored new QAU data in Firestore (ID: {doc_ref.id})")
            
            # Add a record to the scrape_tasks collection
            task_id = f"qau-{int(datetime.now().timestamp())}"
            task_data = {
                "status": "completed",
                "started_at": firestore.SERVER_TIMESTAMP,
                "completed_at": firestore.SERVER_TIMESTAMP,
                "universities_scraped": 1,
                "university": "Quaid-i-Azam University (QAU)",
                "university_id": doc_ref.id,
                "triggered_by": "direct_import"
            }
            
            db.collection("scrape_tasks").document(task_id).set(task_data)
            logger.info(f"Created scrape task record with ID: {task_id}")
            
            return 0
    except Exception as e:
        logger.error(f"Error importing QAU data: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
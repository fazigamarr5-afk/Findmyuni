#!/usr/bin/env python
"""
QAU Scraper Runner Script

This script runs the QAU scraper and stores the data in Firestore.
It can be run directly from the command line.
"""

import os
import sys
import logging
import time
from firebase_admin import firestore

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("qau_scraper_runner")

def initialize_firebase():
    """Initialize Firebase using the shared config module."""
    try:
        from app.config.firebase import init_firebase
        return init_firebase()
    except Exception as e:
        logger.error(f"Error initializing Firebase: {e}")
        return None

def main():
    """Main function to run the QAU scraper."""
    logger.info("Starting QAU scraper runner")
    
    # Import the QAU scraper module
    try:
        from app.services.qau_scraper import scrape_qau_university, store_qau_in_firestore
    except ImportError:
        logger.error("Failed to import QAU scraper. Make sure you're running from the project root.")
        return 1
    
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        logger.error("Failed to initialize Firebase. Exiting.")
        return 1
    
    # Run the scraper
    try:
        logger.info("Starting QAU scraping process...")
        start_time = time.time()
        
        # Run the scraper
        qau_data = scrape_qau_university()
        
        if qau_data:
            # Store in Firestore
            doc_id = store_qau_in_firestore(db, qau_data)
            
            if doc_id:
                end_time = time.time()
                logger.info(f"QAU scraping completed successfully in {end_time - start_time:.2f} seconds")
                logger.info(f"Data stored in Firestore with ID: {doc_id}")
                
                # Add the task record
                task_id = f"qau-{int(time.time())}"
                task_data = {
                    "status": "completed",
                    "started_at": firestore.SERVER_TIMESTAMP,
                    "completed_at": firestore.SERVER_TIMESTAMP,
                    "universities_scraped": 1,
                    "execution_time_seconds": end_time - start_time,
                    "university": "Quaid-i-Azam University (QAU)",
                    "university_id": doc_id,
                    "triggered_by": "command_line"
                }
                
                db.collection("scrape_tasks").document(task_id).set(task_data)
                logger.info(f"Created scrape task record with ID: {task_id}")
                
                return 0
            else:
                logger.error("Failed to store QAU data in Firestore")
                return 1
        else:
            logger.error("Failed to scrape QAU data")
            return 1
            
    except Exception as e:
        logger.error(f"Error during QAU scraping: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
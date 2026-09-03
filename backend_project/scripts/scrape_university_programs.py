"""
University Program Scraper
Scrapes actual university websites for program data.
Falls back to AI for universities where scraping fails.

Usage:
  python scripts/scrape_university_programs.py
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
import logging
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Keywords that indicate program listings
PROGRAM_KEYWORDS = [
    'program', 'course', 'department', 'faculty', 'degree',
    'bachelor', 'master', 'phd', 'bs', 'ms', 'mba',
    'engineering', 'computer', 'science', 'arts', 'commerce',
    'medical', 'pharmacy', 'law', 'education', 'business'
]

# Keywords to identify program categories
CATEGORY_PATTERNS = {
    'BSPrograms': [
        r'bachelor', r'\bbs\b', r'\bbsc\b', r'\bba\b', r'\bb\.?s\b',
        r'undergraduate', r'under graduate', r'first degree'
    ],
    'MSPrograms': [
        r'master', r'\bms\b', r'\bmsc\b', r'\bma\b', r'm\.?s\b',
        r'mphil', r'm\.?phil', r'postgraduate', r'post graduate'
    ],
    'PhDPrograms': [
        r'phd', r'ph\.?d', r'doctorate', r'doctoral', r'doctor of philosophy'
    ]
}


def scrape_university_programs(url, university_name):
    """
    Scrape program data from a university website.
    
    Returns dict with programs or None if failed.
    """
    if not url:
        return None
    
    # Ensure URL has protocol
    if not url.startswith('http'):
        url = 'https://' + url
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        programs = {
            'BSPrograms': [],
            'MSPrograms': [],
            'PhDPrograms': []
        }
        
        # Strategy 1: Look for program listing sections
        # Common patterns in Pakistani university websites
        program_sections = []
        
        # Look for sections with program-related classes/IDs
        for element in soup.find_all(['div', 'section', 'ul', 'table'], 
                                      class_=re.compile(r'program|course|department|degree', re.I)):
            program_sections.append(element)
        
        # Look for h2/h3/h4 with program-related text
        for heading in soup.find_all(['h2', 'h3', 'h4']):
            text = heading.get_text(strip=True).lower()
            if any(kw in text for kw in ['program', 'course', 'department', 'degree', 'offer']):
                # Get sibling or parent content
                next_elem = heading.find_next(['ul', 'div', 'table'])
                if next_elem:
                    program_sections.append(next_elem)
        
        # Extract programs from sections
        for section in program_sections:
            items = section.find_all(['li', 'a', 'td', 'p', 'span'])
            for item in items:
                text = item.get_text(strip=True)
                if len(text) > 3 and len(text) < 100:  # Reasonable program name length
                    # Skip navigation items
                    if text.lower() in ['home', 'about', 'contact', 'news', 'events', 'admissions']:
                        continue
                    if any(skip in text.lower() for skip in ['click here', 'read more', 'view all']):
                        continue
                    
                    # Categorize the program
                    categorized = False
                    for category, patterns in CATEGORY_PATTERNS.items():
                        for pattern in patterns:
                            if re.search(pattern, text, re.I):
                                if text not in programs[category]:
                                    programs[category].append(text)
                                categorized = True
                                break
                        if categorized:
                            break
        
        # Strategy 2: Look for links containing program-related paths
        for link in soup.find_all('a', href=True):
            href = link.get('href', '').lower()
            text = link.get_text(strip=True)
            
            if any(kw in href for kw in ['program', 'course', 'department', 'academic']):
                if text and len(text) > 3 and len(text) < 100:
                    for category, patterns in CATEGORY_PATTERNS.items():
                        for pattern in patterns:
                            if re.search(pattern, text, re.I):
                                if text not in programs[category]:
                                    programs[category].append(text)
                                break
        
        # Check if we found any programs
        total_programs = sum(len(v) for v in programs.values())
        
        if total_programs > 0:
            logger.info(f"Scraped {total_programs} programs from {university_name}")
            return programs
        else:
            logger.warning(f"No programs found at {url}")
            return None
            
    except requests.RequestException as e:
        logger.error(f"Request failed for {url}: {e}")
        return None
    except Exception as e:
        logger.error(f"Parsing failed for {url}: {e}")
        return None


def main():
    """Main function to scrape all universities without programs."""
    from app.config.supabase import get_supabase
    
    db = get_supabase()
    
    # Get universities without programs
    result = db.table('universities').select('id, name, url, programs').execute()
    universities = result.data
    
    no_programs = [u for u in universities if not (u.get('programs') and any(u['programs'].get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms']))]
    
    logger.info(f"Found {len(no_programs)} universities needing program data")
    
    stats = {'scraped': 0, 'failed': 0, 'updated': 0}
    
    for i, uni in enumerate(no_programs):
        uni_id = uni['id']
        uni_name = uni['name']
        url = uni.get('url', '')
        
        logger.info(f"[{i+1}/{len(no_programs)}] Scraping: {uni_name}")
        
        # Try to scrape
        programs = scrape_university_programs(url, uni_name)
        
        if programs:
            # Update in database
            try:
                db.table('universities').update({
                    'programs': programs,
                    'scraped_at': datetime.utcnow().isoformat()
                }).eq('id', uni_id).execute()
                
                stats['scraped'] += 1
                stats['updated'] += 1
                logger.info(f"Updated {uni_name}: {sum(len(v) for v in programs.values())} programs")
            except Exception as e:
                logger.error(f"Database update failed for {uni_name}: {e}")
                stats['failed'] += 1
        else:
            stats['failed'] += 1
        
        # Rate limiting
        time.sleep(1)
        
        # Progress update every 20
        if (i + 1) % 20 == 0:
            logger.info(f"Progress: {stats['updated']} updated, {stats['failed']} failed")
    
    logger.info(f"\nScraping complete: {stats}")
    return stats


if __name__ == "__main__":
    main()

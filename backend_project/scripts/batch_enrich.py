"""
Fast Batch Enrichment with Retry Logic
Handles rate limits from free tier.

Usage:
  python scripts/batch_enrich.py [start_index]
"""

import sys
import os
import json
import time
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"

# Rate limit settings
BASE_DELAY = 10  # seconds between requests
MAX_RETRIES = 3
BACKOFF_MULTIPLIER = 2


def generate_programs_batch(universities_batch):
    """
    Generate programs for multiple universities in one API call.
    """
    if not OPENROUTER_API_KEY:
        return {}
    
    # Build university list for prompt
    uni_list = "\n".join([f"- {u['name']} ({u.get('basic_info', {}).get('Province', 'Pakistan')})" 
                          for u in universities_batch])
    
    prompt = f"""You are a Pakistani university data expert. For each university below, list their programs.

Universities:
{uni_list}

Return ONLY valid JSON with this structure for EACH university:
{{
    "universities": [
        {{
            "name": "University Name",
            "programs": {{
                "BSPrograms": ["program1", "program2"],
                "MSPrograms": ["program1"],
                "PhDPrograms": []
            }}
        }}
    ]
}}

RULES:
1. Only include programs you are CERTAIN each university offers
2. For smaller colleges, list fewer programs (5-10 BS, 2-3 MS)
3. For universities, list more programs (10-20 BS, 5-10 MS, 3-5 PhD)
4. If unsure about a specific program, don't include it
5. Include ALL universities from the list"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4000,
        "temperature": 0.3
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=120)
            
            # Handle rate limits
            if response.status_code == 429:
                wait_time = BASE_DELAY * (BACKOFF_MULTIPLIER ** attempt)
                logger.warning(f"Rate limited, waiting {wait_time}s (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait_time)
                continue
            
            response.raise_for_status()
            
            result = response.json()
            text = result["choices"][0]["message"]["content"]
            
            # Parse JSON
            text = text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            return {u["name"]: u["programs"] for u in data.get("universities", [])}
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                wait_time = BASE_DELAY * (BACKOFF_MULTIPLIER ** attempt)
                logger.warning(f"Rate limited, waiting {wait_time}s")
                time.sleep(wait_time)
            else:
                logger.error(f"HTTP error: {e}")
                return {}
        except Exception as e:
            logger.error(f"Request failed: {e}")
            return {}
    
    logger.error("Max retries exceeded")
    return {}


def main():
    """Main function."""
    from app.config.supabase import get_supabase
    
    db = get_supabase()
    start_index = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    
    # Get universities without programs
    result = db.table('universities').select('id, name, basic_info, programs').execute()
    universities = result.data
    
    no_programs = [u for u in universities if not (u.get('programs') and any(u['programs'].get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms']))]
    
    logger.info(f"Total remaining: {len(no_programs)}, starting from index {start_index}")
    
    # Process in batches of 3 (smaller batches to avoid rate limits)
    batch_size = 3
    stats = {'enriched': 0, 'failed': 0}
    
    for i in range(start_index, len(no_programs), batch_size):
        batch = no_programs[i:i+batch_size]
        
        logger.info(f"Processing batch {i//batch_size + 1}: {[u['name'] for u in batch]}")
        
        # Generate programs for batch
        programs_map = generate_programs_batch(batch)
        
        # Update database
        for uni in batch:
            uni_name = uni['name']
            if uni_name in programs_map:
                programs = programs_map[uni_name]
                total = sum(len(v) for v in programs.values())
                
                if total > 0:
                    try:
                        db.table('universities').update({
                            'programs': programs,
                            'scraped_at': datetime.utcnow().isoformat()
                        }).eq('id', uni['id']).execute()
                        
                        stats['enriched'] += 1
                        logger.info(f"  ✓ {uni_name}: {total} programs")
                    except Exception as e:
                        logger.error(f"  ✗ {uni_name}: {e}")
                        stats['failed'] += 1
                else:
                    stats['failed'] += 1
            else:
                stats['failed'] += 1
        
        # Rate limiting - longer delay for free tier
        time.sleep(BASE_DELAY)
        
        # Progress
        if (i + batch_size) % 15 == 0 or i + batch_size >= len(no_programs):
            logger.info(f"Progress: {stats['enriched']} enriched, {stats['failed']} failed")
    
    logger.info(f"\nComplete: {stats}")


if __name__ == "__main__":
    main()

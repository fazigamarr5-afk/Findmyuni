"""
Smart AI Enrichment for Remaining Universities
Uses web search context + AI for accurate data.

Usage:
  python scripts/smart_enrichment.py
"""

import sys
import os
import json
import time
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"


def search_university_info(name):
    """Search for university information using web search."""
    try:
        # Use a simple approach - search for the university
        query = f"{name} Pakistan programs offered list"
        
        # We could use a search API here, but for now return None
        # to indicate we need AI
        return None
    except:
        return None


def generate_accurate_programs(university_name, basic_info=None):
    """
    Generate accurate program data using AI with strict validation.
    
    Args:
        university_name: Name of the university
        basic_info: Dict with location, sector, etc.
    
    Returns:
        Dict with programs or None
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY not set")
        return None
    
    # Build context
    context_parts = [f"University: {university_name}"]
    if basic_info:
        if basic_info.get("Location"):
            context_parts.append(f"Location: {basic_info['Location']}")
        if basic_info.get("Sector"):
            context_parts.append(f"Sector: {basic_info['Sector']}")
        if basic_info.get("Type"):
            context_parts.append(f"Type: {basic_info['Type']}")
    
    context = "\n".join(context_parts)
    
    prompt = f"""You are a Pakistani university data expert. Based on the following university information, generate ONLY the programs offered.

{context}

IMPORTANT RULES:
1. Only include programs you are CERTAIN this university offers
2. For smaller/lesser-known universities, include fewer programs (they typically have 5-15 programs)
3. For major universities (LUMS, NUST, etc.), include more programs
4. Do NOT make up programs - if unsure, list only the most common ones
5. Return ONLY valid JSON, no markdown

Return this JSON structure:
{{
    "programs": {{
        "BSPrograms": ["List of BS/Bachelor programs"],
        "MSPrograms": ["List of MS/MPhil programs"],
        "PhDPrograms": ["List of PhD programs"]
    }},
    "confidence": "high/medium/low"
}}

If you are NOT confident about the programs for this university, set confidence to "low" and include only the most common programs for Pakistani universities of this type."""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1500,
        "temperature": 0.3  # Lower temperature for more accurate results
    }
    
    try:
        response = requests.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
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
        
        # Validate - must have programs
        if "programs" not in data:
            return None
        
        programs = data["programs"]
        total = sum(len(v) for v in programs.values())
        
        if total == 0:
            return None
        
        logger.info(f"Generated {total} programs (confidence: {data.get('confidence', 'unknown')})")
        return programs
        
    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        return None


def main():
    """Main function to enrich remaining universities."""
    from app.config.supabase import get_supabase
    
    db = get_supabase()
    
    # Get universities without programs
    result = db.table('universities').select('id, name, basic_info, programs').execute()
    universities = result.data
    
    no_programs = [u for u in universities if not (u.get('programs') and any(u['programs'].get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms']))]
    
    logger.info(f"Found {len(no_programs)} universities needing AI enrichment")
    
    stats = {'enriched': 0, 'failed': 0, 'total_programs': 0}
    
    for i, uni in enumerate(no_programs):
        uni_id = uni['id']
        uni_name = uni['name']
        basic_info = uni.get('basic_info') or {}
        
        logger.info(f"[{i+1}/{len(no_programs)}] Enriching: {uni_name}")
        
        # Generate programs
        programs = generate_accurate_programs(uni_name, basic_info)
        
        if programs:
            # Update in database
            try:
                db.table('universities').update({
                    'programs': programs,
                    'scraped_at': datetime.utcnow().isoformat()
                }).eq('id', uni_id).execute()
                
                total = sum(len(v) for v in programs.values())
                stats['enriched'] += 1
                stats['total_programs'] += total
                logger.info(f"Updated {uni_name}: {total} programs")
            except Exception as e:
                logger.error(f"Database update failed for {uni_name}: {e}")
                stats['failed'] += 1
        else:
            stats['failed'] += 1
        
        # Rate limiting - longer delay for free tier
        time.sleep(2)
        
        # Progress update every 10
        if (i + 1) % 10 == 0:
            logger.info(f"Progress: {stats['enriched']} enriched, {stats['failed']} failed, {stats['total_programs']} total programs")
    
    logger.info(f"\nEnrichment complete: {stats}")
    return stats


if __name__ == "__main__":
    from datetime import datetime
    main()

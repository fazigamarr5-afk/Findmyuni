"""
AI Enrichment Service
Uses OpenRouter API to enrich university data with programs, descriptions, and facilities.
"""

import os
import json
import logging
import time
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# OpenRouter API setup
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Default model - you can change this to any model available on OpenRouter
# Free models: google/gemma-4-26b-a4b-it:free, nvidia/nemotron-3-super-120b-a12b:free
DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b:free"


def call_openrouter(prompt, model=None, max_tokens=2000):
    """
    Call OpenRouter API.
    
    Args:
        prompt: The prompt to send
        model: Model to use (defaults to DEFAULT_MODEL)
        max_tokens: Maximum tokens in response
        
    Returns:
        Response text or None on error
    """
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY not set")
        return None
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://freebuff.com",
        "X-Title": "Freebuff University Enrichment"
    }
    
    payload = {
        "model": model or DEFAULT_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.7
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
        return result["choices"][0]["message"]["content"]
        
    except requests.exceptions.RequestException as e:
        logger.error(f"OpenRouter API error: {e}")
        return None
    except (KeyError, IndexError) as e:
        logger.error(f"Failed to parse OpenRouter response: {e}")
        return None


def generate_university_enrichment(university_name, basic_info=None, existing_programs=None):
    """
    Use OpenRouter to generate enriched data for a university.
    
    Args:
        university_name: Name of the university
        basic_info: Dict with location, sector, etc.
        existing_programs: Dict with any existing program data
    
    Returns:
        Dict with enriched programs, description, facilities
    """
    # Build context
    context_parts = [f"University: {university_name}"]
    if basic_info:
        if basic_info.get("Location"):
            context_parts.append(f"Location: {basic_info['Location']}")
        if basic_info.get("Sector"):
            context_parts.append(f"Sector: {basic_info['Sector']}")
        if basic_info.get("Province"):
            context_parts.append(f"Province: {basic_info['Province']}")
    
    context = "\n".join(context_parts)
    
    prompt = f"""You are a Pakistani university data expert. Based on the following university information, generate comprehensive data.

{context}

Please provide a JSON response with the following structure (return ONLY valid JSON, no markdown):
{{
    "description": "A 2-3 sentence description of the university",
    "programs": {{
        "BSPrograms": ["List of BS/Bachelor programs offered"],
        "MSPrograms": ["List of MS/MPhil programs offered"],
        "PhDPrograms": ["List of PhD programs offered"]
    }},
    "facilities": {{
        "hostel": true/false,
        "library": true/false,
        "lab": true/false,
        "sports": true/false,
        "wifi": true/false,
        "cafeteria": true/false,
        "medical": true/false
    }},
    "admission_open": true/false
}}

Be accurate based on well-known information about Pakistani universities. If you're unsure about a specific program, include commonly offered programs for that university type. Return ONLY the JSON object."""

    text = call_openrouter(prompt)
    if not text:
        return None
    
    # Try to extract JSON from response
    # Sometimes models wrap in markdown code blocks
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    
    try:
        data = json.loads(text)
        logger.info(f"Successfully enriched: {university_name}")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse response for {university_name}: {e}")
        logger.debug(f"Raw response: {text[:200]}")
        return None


def enrich_university_in_supabase(db, university_id, university_name, basic_info=None, existing_programs=None):
    """
    Enrich a single university in Supabase using AI.
    
    Args:
        db: Supabase client
        university_id: UUID of the university
        university_name: Name of the university
        basic_info: Existing basic_info dict
        existing_programs: Existing programs dict
    
    Returns:
        True if successful, False otherwise
    """
    # Skip if already has programs
    if existing_programs and any(existing_programs.get(k) for k in ["BSPrograms", "MSPrograms", "PhDPrograms"]):
        logger.info(f"Skipping {university_name} - already has programs")
        return True
    
    enrichment = generate_university_enrichment(university_name, basic_info, existing_programs)
    if not enrichment:
        return False
    
    # Prepare update data
    update_data = {
        "description": enrichment.get("description", ""),
        "programs": enrichment.get("programs", {}),
        "facilities": enrichment.get("facilities", {}),
        "admission_open": enrichment.get("admission_open", True),
        "scraped_at": datetime.utcnow().isoformat(),
    }
    
    try:
        db.table("universities").update(update_data).eq("id", university_id).execute()
        logger.info(f"Enriched and updated: {university_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to update {university_name} in Supabase: {e}")
        return False


def enrich_all_universities(db, batch_size=5, delay=2.0):
    """
    Enrich all universities in Supabase that have empty programs.
    
    Args:
        db: Supabase client
        batch_size: Number of universities to process per batch
        delay: Seconds to wait between API calls (rate limiting)
    
    Returns:
        Dict with stats
    """
    stats = {"total": 0, "enriched": 0, "skipped": 0, "failed": 0}
    
    try:
        # Get all universities
        result = db.table("universities").select("id, name, basic_info, programs, description").execute()
        universities = result.data
        
        stats["total"] = len(universities)
        logger.info(f"Found {stats['total']} universities to process")
        
        for i, uni in enumerate(universities):
            uni_id = uni["id"]
            uni_name = uni["name"]
            basic_info = uni.get("basic_info") or {}
            programs = uni.get("programs") or {}
            
            # Check if already enriched
            has_programs = any(programs.get(k) for k in ["BSPrograms", "MSPrograms", "PhDPrograms"])
            has_description = bool(uni.get("description"))
            
            if has_programs and has_description:
                stats["skipped"] += 1
                continue
            
            # Enrich
            logger.info(f"[{i+1}/{stats['total']}] Enriching: {uni_name}")
            success = enrich_university_in_supabase(
                db, uni_id, uni_name, basic_info, programs
            )
            
            if success:
                stats["enriched"] += 1
            else:
                stats["failed"] += 1
            
            # Rate limiting
            if (i + 1) % batch_size == 0:
                logger.info(f"Batch pause... ({stats['enriched']} enriched so far)")
                time.sleep(delay)
            
            # Small delay between calls
            time.sleep(1.0)
            
    except Exception as e:
        logger.error(f"Error in enrichment loop: {e}")
    
    logger.info(f"\nEnrichment complete: {stats}")
    return stats


if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    )
    
    # Initialize Supabase
    from app.config.supabase import get_supabase
    db = get_supabase()
    
    # Test with a single university
    test_result = generate_university_enrichment(
        "National University of Sciences & Technology (NUST)",
        {"Location": "Islamabad, Pakistan", "Sector": "Public"}
    )
    
    if test_result:
        print("\n=== Test Enrichment ===")
        print(json.dumps(test_result, indent=2))
    else:
        print("Test failed - check API key")

"""
Fix data quality issues:
1. Clean up invalid program names (scraped text, descriptions, etc.)
2. Remove duplicate university entries
"""

import sys
import os
import re
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase


def clean_program_name(name):
    """Clean a program name by extracting the actual program name."""
    if not isinstance(name, str):
        return name
    
    name = name.strip()
    
    # Remove excessive whitespace/newlines
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'\r\n|\r|\n', ' ', name)
    
    # Skip entries that are clearly not program names
    skip_patterns = [
        r'^(admissions?\s+are\s+open)',
        r'^(explore\s+our)',
        r'^(shape\s+your)',
        r'^(prepare\s+for)',
        r'^(preston\s+university\s+is)',
        r'^(quality\s+enhancement)',
        r'^(last\s+date\s+for)',
        r'^(online\s+renewal)',
        r'^(undergraduate\s+degree)',
        r'^(associate\s+degree)',
        r'^(bachelor\s+of\s+.*with\s+offered)',
    ]
    
    for pattern in skip_patterns:
        if re.match(pattern, name, re.IGNORECASE):
            return None  # Skip this entry
    
    # For entries like "BS FinTechEligibility Criteria:..." extract program name
    if 'Eligibility Criteria:' in name:
        # Extract part before "Eligibility Criteria:"
        parts = name.split('Eligibility Criteria:')
        name = parts[0].strip()
        # Remove "BS ", "MS ", "PhD " prefix if present at start
        name = re.sub(r'^(BS|MS|PhD|MPhil|Ph\.D|M\.Phil)\s*', '', name).strip()
    
    # For entries like "M.Phil. Mathematics\r\r\n..." extract program name
    if '\r' in name or '\n' in name:
        name = re.split(r'[\r\n]+', name)[0].strip()
    
    # Clean up trailing ellipsis
    name = re.sub(r'\.\.\.$', '', name).strip()
    
    # If remaining name is too short or doesn't look like a program, skip
    if len(name) < 2:
        return None
    
    # If it's just a degree level with no subject (e.g., "M.Phil."), skip
    if re.match(r'^(BS|MS|PhD|MPhil|Ph\.D|M\.Phil)\.?\s*$', name, re.IGNORECASE):
        return None
    
    return name


def fix_programs(universities, db):
    """Fix invalid program names across all universities."""
    print("=== FIXING PROGRAM NAMES ===\n")
    
    fixed_count = 0
    removed_count = 0
    
    for u in universities:
        progs = u.get('programs')
        if not progs or not isinstance(progs, dict):
            continue
        
        has_old = any(progs.get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
        has_new = any(progs.get(k) for k in ['u', 'g', 'd'])
        
        if has_old:
            bs_key, ms_key, phd_key = 'BSPrograms', 'MSPrograms', 'PhDPrograms'
        elif has_new:
            bs_key, ms_key, phd_key = 'u', 'g', 'd'
        else:
            continue
        
        original = {
            bs_key: list(progs.get(bs_key, [])),
            ms_key: list(progs.get(ms_key, [])),
            phd_key: list(progs.get(phd_key, []))
        }
        
        changes_made = False
        
        for key in [bs_key, ms_key, phd_key]:
            programs = progs.get(key, [])
            if not isinstance(programs, list):
                continue
            
            cleaned = []
            for p in programs:
                if isinstance(p, str) and len(p) > 80:
                    new_name = clean_program_name(p)
                    if new_name and new_name != p:
                        cleaned.append(new_name)
                        changes_made = True
                        removed_count += 1
                    elif new_name is None:
                        changes_made = True
                        removed_count += 1
                    else:
                        cleaned.append(p)
                else:
                    cleaned.append(p)
            
            progs[key] = cleaned
        
        if changes_made:
            db.table('universities').update({
                'programs': progs,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }).eq('id', u['id']).execute()
            fixed_count += 1
            
            # Show what changed
            for key in [bs_key, ms_key, phd_key]:
                orig_count = len(original[key])
                new_count = len(progs[key])
                if orig_count != new_count:
                    print(f"  {u['name']}: {key} {orig_count} -> {new_count}")
    
    print(f"\nFixed {fixed_count} universities")
    print(f"Removed {removed_count} invalid program entries")


def remove_duplicate(universities, db):
    """Remove duplicate University of Engineering & Technology entry."""
    print("\n=== REMOVING DUPLICATE ===\n")
    
    # Find the two duplicates
    uet_unis = [u for u in universities if u['name'] == 'University of Engineering & Technology']
    
    if len(uet_unis) != 2:
        print(f"Expected 2 duplicates, found {len(uet_unis)}")
        return
    
    # Keep the one with more data
    for u in uet_unis:
        progs = u.get('programs', {})
        if isinstance(progs, dict):
            has_old = any(progs.get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
            has_new = any(progs.get(k) for k in ['u', 'g', 'd'])
            if has_old:
                prog_count = sum(len(progs.get(k, [])) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
            elif has_new:
                prog_count = sum(len(progs.get(k, [])) for k in ['u', 'g', 'd'])
            else:
                prog_count = 0
        else:
            prog_count = 0
        
        print(f"  {u['id']}: {u['name']} - {prog_count} programs")
    
    # Keep the one with more programs, delete the other
    keep = max(uet_unis, key=lambda u: (
        sum(len(u.get('programs', {}).get(k, [])) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms', 'u', 'g', 'd'])
    ))
    delete = min(uet_unis, key=lambda u: (
        sum(len(u.get('programs', {}).get(k, [])) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms', 'u', 'g', 'd'])
    ))
    
    print(f"\n  Keeping:   {keep['id']}")
    print(f"  Deleting:  {delete['id']}")
    
    # Delete the duplicate
    db.table('universities').delete().eq('id', delete['id']).execute()
    print(f"  Deleted duplicate entry")


def main():
    db = get_supabase()
    result = db.table('universities').select('*').execute()
    universities = result.data
    
    print(f"Loaded {len(universities)} universities\n")
    
    fix_programs(universities, db)
    remove_duplicate(universities, db)
    
    print("\n=== DONE ===")


if __name__ == "__main__":
    main()

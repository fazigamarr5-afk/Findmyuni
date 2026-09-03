"""
Comprehensive Database Validation Script
Checks data quality, consistency, and accuracy across all 337 universities.
"""

import sys
import os
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from app.config.supabase import get_supabase


class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


def header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{Colors.END}")


def ok(text):
    print(f"  {Colors.GREEN}[OK]{Colors.END} {text}")


def warn(text):
    print(f"  {Colors.YELLOW}[!!]{Colors.END} {text}")


def error(text):
    print(f"  {Colors.RED}[XX]{Colors.END} {text}")


def validate_completeness(universities):
    """Check that all required fields are populated."""
    header("1. FIELD COMPLETENESS")
    
    required_fields = ['name', 'description', 'programs', 'facilities', 'basic_info', 'scholarships']
    optional_fields = ['url', 'apply_link', 'admission_open']
    
    total = len(universities)
    
    for field in required_fields:
        filled = sum(1 for u in universities if u.get(field) and len(str(u[field])) > 5)
        pct = filled * 100 // total
        if pct == 100:
            ok(f"{field}: {filled}/{total} (100%)")
        elif pct >= 90:
            warn(f"{field}: {filled}/{total} ({pct}%)")
        else:
            error(f"{field}: {filled}/{total} ({pct}%)")
            missing = [u['name'] for u in universities if not u.get(field) or len(str(u[field])) <= 5]
            for m in missing[:5]:
                print(f"       Missing: {m}")
            if len(missing) > 5:
                print(f"       ... and {len(missing)-5} more")
    
    for field in optional_fields:
        filled = sum(1 for u in universities if u.get(field) and len(str(u[field])) > 3)
        pct = filled * 100 // total
        print(f"  {field:20s}: {filled}/{total} ({pct}%) [optional]")


def validate_programs(universities):
    """Validate program data structure and content."""
    header("2. PROGRAM DATA VALIDATION")
    
    issues = []
    format_counter = Counter()
    total_programs = {'BS': 0, 'MS': 0, 'PhD': 0}
    
    for u in universities:
        progs = u.get('programs')
        if not progs or not isinstance(progs, dict):
            issues.append((u['name'], "No programs data"))
            continue
        
        # Check format
        has_old_format = any(progs.get(k) for k in ['BSPrograms', 'MSPrograms', 'PhDPrograms'])
        has_new_format = any(progs.get(k) for k in ['u', 'g', 'd'])
        
        if has_old_format:
            format_counter['BSPrograms/MSPrograms/PhDPrograms'] += 1
            bs = progs.get('BSPrograms', [])
            ms = progs.get('MSPrograms', [])
            phd = progs.get('PhDPrograms', [])
        elif has_new_format:
            format_counter['u/g/d'] += 1
            bs = progs.get('u', [])
            ms = progs.get('g', [])
            phd = progs.get('d', [])
        else:
            issues.append((u['name'], "Programs dict exists but no recognized keys"))
            continue
        
        # Validate lists
        for level, programs in [('BS', bs), ('MS', ms), ('PhD', phd)]:
            if not isinstance(programs, list):
                issues.append((u['name'], f"{level} programs is not a list: {type(programs).__name__}"))
                continue
            total_programs[level] += len(programs)
            
            for prog in programs:
                if not isinstance(prog, str):
                    issues.append((u['name'], f"Non-string program in {level}: {prog}"))
                elif len(prog) < 2:
                    issues.append((u['name'], f"Too short program name in {level}: '{prog}'"))
                elif len(prog) > 80:
                    issues.append((u['name'], f"Too long program name in {level}: '{prog[:50]}...'"))
        
        # Check for empty programs
        if not bs and not ms and not phd:
            issues.append((u['name'], "All program lists are empty"))
    
    # Report
    print(f"  Program formats found:")
    for fmt, count in format_counter.most_common():
        print(f"    {fmt}: {count} universities")
    
    print(f"\n  Total programs:")
    print(f"    BS/Undergraduate: {total_programs['BS']}")
    print(f"    MS/Graduate:      {total_programs['MS']}")
    print(f"    PhD/Doctoral:     {total_programs['PhD']}")
    print(f"    Total:            {sum(total_programs.values())}")
    
    if issues:
        print(f"\n  Issues found ({len(issues)}):")
        for name, issue in issues[:15]:
            print(f"    {Colors.YELLOW}*{Colors.END} {name}: {issue}")
        if len(issues) > 15:
            print(f"    ... and {len(issues)-15} more")
    else:
        ok("All program data is valid")


def validate_names(universities):
    """Check for name consistency and duplicates."""
    header("3. UNIVERSITY NAME VALIDATION")
    
    names = [u['name'] for u in universities]
    name_lower = [n.lower().strip() for n in names]
    
    # Check duplicates
    seen = {}
    duplicates = []
    for i, n in enumerate(name_lower):
        if n in seen:
            duplicates.append((names[seen[n]], names[i]))
        else:
            seen[n] = i
    
    if duplicates:
        warn(f"Possible duplicates found ({len(duplicates)}):")
        for a, b in duplicates[:10]:
            print(f"    * '{a}' vs '{b}'")
    else:
        ok("No duplicate names found")
    
    # Check naming conventions
    naming_issues = []
    for u in universities:
        name = u['name']
        if name != name.strip():
            naming_issues.append((name, "Extra whitespace"))
        if re.search(r'\s{2,}', name):
            naming_issues.append((name, "Multiple consecutive spaces"))
        if name.startswith(' ') or name.endswith(' '):
            naming_issues.append((name, "Leading/trailing spaces"))
    
    if naming_issues:
        warn(f"Naming issues ({len(naming_issues)}):")
        for name, issue in naming_issues[:10]:
            print(f"    * {name}: {issue}")
    else:
        ok("All names are properly formatted")


def validate_urls(universities):
    """Validate URL formats."""
    header("4. URL VALIDATION")
    
    url_pattern = re.compile(r'^https?://')
    issues = []
    
    for u in universities:
        url = u.get('url')
        if url and not url_pattern.match(str(url)):
            issues.append((u['name'], f"Invalid URL: {url}"))
    
    with_url = sum(1 for u in universities if u.get('url'))
    https = sum(1 for u in universities if u.get('url') and str(u['url']).startswith('https'))
    
    print(f"  With URL: {with_url}/{len(universities)} ({with_url*100//len(universities)}%)")
    print(f"  Using HTTPS: {https}/{with_url}" if with_url else "  No URLs to check")
    
    if issues:
        warn(f"Invalid URLs ({len(issues)}):")
        for name, issue in issues[:10]:
            print(f"    * {name}: {issue}")
    else:
        ok("All URLs are valid")


def validate_scholarships(universities):
    """Validate scholarship data structure."""
    header("5. SCHOLARSHIP DATA VALIDATION")
    
    dict_count = 0
    list_count = 0
    issues = []
    total_scholarships = 0
    
    categories = Counter()
    
    for u in universities:
        sch = u.get('scholarships')
        if not sch:
            issues.append((u['name'], "No scholarship data"))
            continue
        
        if isinstance(sch, dict):
            dict_count += 1
            for key in sch:
                if key in ['merit', 'need_based', 'government', 'international', 'details']:
                    categories[key] += 1
            
            for key, val in sch.items():
                if isinstance(val, list):
                    total_scholarships += len(val)
                    for s in val:
                        if not isinstance(s, str) or len(s) < 3:
                            issues.append((u['name'], f"Invalid scholarship entry: {s}"))
        elif isinstance(sch, list):
            list_count += 1
            total_scholarships += len(sch)
        else:
            issues.append((u['name'], f"Unexpected type: {type(sch).__name__}"))
    
    print(f"  Data format:")
    print(f"    Dict format: {dict_count} universities")
    print(f"    List format: {list_count} universities")
    print(f"  Total scholarship entries: {total_scholarships}")
    
    if categories:
        print(f"\n  Category coverage (dict format):")
        for cat, count in categories.most_common():
            print(f"    {cat}: {count} universities")
    
    if issues:
        warn(f"Issues ({len(issues)}):")
        for name, issue in issues[:10]:
            print(f"    * {name}: {issue}")
    else:
        ok("All scholarship data is valid")


def validate_basic_info(universities):
    """Validate basic_info structure."""
    header("6. BASIC INFO VALIDATION")
    
    issues = []
    key_coverage = Counter()
    
    for u in universities:
        bi = u.get('basic_info')
        if not bi or not isinstance(bi, dict):
            issues.append((u['name'], "No basic_info or not a dict"))
            continue
        
        for key in bi:
            key_coverage[key] += 1
        
        has_location = any(k for k in bi if 'location' in k.lower() or 'city' in k.lower() or 'address' in k.lower())
        has_type = any(k for k in bi if 'type' in k.lower() or 'sector' in k.lower() or 'public' in str(bi[k]).lower() or 'private' in str(bi[k]).lower())
        
        if not has_location:
            issues.append((u['name'], "Missing location/city info"))
        if not has_type:
            issues.append((u['name'], "Missing type/sector info"))
    
    print(f"  Field coverage across all basic_info:")
    for key, count in key_coverage.most_common(15):
        print(f"    {key:25s}: {count}/{len(universities)} ({count*100//len(universities)}%)")
    
    if issues:
        warn(f"Issues ({len(issues)}):")
        for name, issue in issues[:10]:
            print(f"    * {name}: {issue}")
    else:
        ok("All basic_info data is valid")


def validate_facilities(universities):
    """Validate facilities data."""
    header("7. FACILITIES VALIDATION")
    
    issues = []
    all_facilities = Counter()
    
    for u in universities:
        fac = u.get('facilities')
        if not fac:
            issues.append((u['name'], "No facilities data"))
            continue
        
        if isinstance(fac, list):
            for f in fac:
                if isinstance(f, str):
                    all_facilities[f] += 1
                else:
                    issues.append((u['name'], f"Non-string facility: {f}"))
        elif isinstance(fac, dict):
            for key, val in fac.items():
                if isinstance(val, list):
                    for f in val:
                        if isinstance(f, str):
                            all_facilities[f] += 1
                elif isinstance(val, str):
                    all_facilities[val] += 1
        else:
            issues.append((u['name'], f"Unexpected type: {type(fac).__name__}"))
    
    print(f"  Most common facilities:")
    for fac, count in all_facilities.most_common(15):
        print(f"    {fac:30s}: {count} universities ({count*100//len(universities)}%)")
    
    if issues:
        warn(f"Issues ({len(issues)}):")
        for name, issue in issues[:5]:
            print(f"    * {name}: {issue}")
    else:
        ok("All facilities data is valid")


def generate_summary(universities):
    """Generate overall summary."""
    header("SUMMARY")
    
    total = len(universities)
    
    scores = []
    for u in universities:
        fields = ['name', 'description', 'programs', 'facilities', 'basic_info', 'scholarships']
        filled = sum(1 for f in fields if u.get(f) and len(str(u[f])) > 5)
        scores.append(filled / len(fields))
    
    avg_score = sum(scores) / len(scores) * 100
    perfect = sum(1 for s in scores if s == 1.0)
    
    print(f"  Total universities: {total}")
    print(f"  Average completeness: {avg_score:.1f}%")
    print(f"  Fully complete records: {perfect}/{total} ({perfect*100//total}%)")
    
    if avg_score >= 95:
        print(f"\n  {Colors.GREEN}{Colors.BOLD}EXCELLENT{Colors.END} - Database is in great shape!")
    elif avg_score >= 85:
        print(f"\n  {Colors.YELLOW}{Colors.BOLD}GOOD{Colors.END} - Minor improvements needed")
    elif avg_score >= 70:
        print(f"\n  {Colors.YELLOW}{Colors.BOLD}FAIR{Colors.END} - Several areas need attention")
    else:
        print(f"\n  {Colors.RED}{Colors.BOLD}NEEDS WORK{Colors.END} - Significant gaps in data")


def main():
    print(f"{Colors.BOLD}")
    print(f"  +==================================================+")
    print(f"  |    UNIVERSITY DATABASE VALIDATION REPORT         |")
    print(f"  |    {datetime.now().strftime('%Y-%m-%d %H:%M:%S'):44s} |")
    print(f"  +==================================================+")
    print(f"{Colors.END}")
    
    db = get_supabase()
    result = db.table('universities').select('*').execute()
    universities = result.data
    
    print(f"\n  Loaded {len(universities)} universities from database")
    
    validate_completeness(universities)
    validate_programs(universities)
    validate_names(universities)
    validate_urls(universities)
    validate_scholarships(universities)
    validate_basic_info(universities)
    validate_facilities(universities)
    generate_summary(universities)


if __name__ == "__main__":
    main()

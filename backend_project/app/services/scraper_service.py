import requests
from bs4 import BeautifulSoup
import re
import time
import uuid
import os
import logging
import sys
import traceback
from datetime import datetime

# Handle imports differently based on how the script is run
try:
    from app.utils.text_processing import clean_university_name
except ModuleNotFoundError:
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    try:
        from app.utils.text_processing import clean_university_name
    except ModuleNotFoundError:
        def clean_university_name(name):
            if not name:
                return ""
            return name.strip()

# Setup logging
logger = logging.getLogger("scraper")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    if __name__ == "__main__":
        print_handler = logging.StreamHandler(sys.stdout)
        print_handler.setFormatter(formatter)
        logger.addHandler(print_handler)

# Initialize Supabase client
db = None

def initialize_supabase():
    """Initialize the Supabase client."""
    global db
    try:
        from app.config.supabase import get_supabase
        db = get_supabase()
        logger.info("Supabase connected successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing Supabase: {e}")
        print(f"Error initializing Supabase: {e}")
        return False

# Initialize when imported as a module
if __name__ != "__main__":
    initialize_supabase()

def scrape_university_page(url):
    """Scrape a single university page from pakeducareers.com."""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        university_data = {
            "name": "",
            "basic_info": {},
            "description": "",
            "programs": {},
            "apply_link": "",
            "url": url,
            "scraped_at": datetime.utcnow().isoformat(),
            "admission_open": True,
        }

        # Extract University Name
        name_element = soup.find("h1", class_="max-sm:text-base sm:text-2xl md:text-3xl lg:text-4xl text-center font-bold text-primary")
        if name_element:
            university_data["name"] = clean_university_name(name_element.get_text(strip=True))
        else:
            alt_name_el = soup.find("h1", class_=re.compile(r"text-primary"))
            if alt_name_el:
                university_data["name"] = clean_university_name(alt_name_el.get_text(strip=True))

        # Extract Basic Info from Table
        table = soup.find("table", class_="min-w-full border-collapse border border-primary text-primary font-semibold")
        if not table:
            table = soup.find("table", class_=re.compile(r"min-w-full"))
        if table:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) == 2:
                    key = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)
                    university_data["basic_info"][key] = value

        # Extract Description
        desc_element = soup.find("div", class_="University_Description")
        if desc_element:
            desc_h1 = desc_element.find("h1")
            if desc_h1:
                university_data["description"] = desc_h1.get_text(strip=True)

        # Extract Offered Programs
        programs_section = soup.find("div", class_="University_Programs")
        if programs_section:
            program_categories = programs_section.find_all("div", class_="BS_Programs")
            for category in program_categories:
                category_title = category.find("h1", class_=re.compile(r"font-bold.*underline"))
                programs_list = category.find("div", class_="pl-2 flex flex-col gap-1")
                if category_title and programs_list:
                    category_name = category_title.get_text(strip=True)
                    programs = []
                    for prog in programs_list.find_all("h1"):
                        prog_text = prog.get_text(strip=True)
                        if ". " in prog_text:
                            try:
                                prog_name = prog_text.split(". ", 1)[1]
                                programs.append(prog_name)
                            except IndexError:
                                continue
                        else:
                            programs.append(prog_text)
                    if programs:
                        university_data["programs"][category_name] = programs

        # Extract Apply Link
        apply_section = soup.find("div", class_="HOW_TO_APPLY?")
        if apply_section:
            apply_link = apply_section.find("a", href=True)
            if apply_link and "href" in apply_link.attrs:
                university_data["apply_link"] = apply_link["href"]
        else:
            apply_btn = soup.find("a", string=re.compile(r"Apply", re.IGNORECASE))
            if apply_btn and apply_btn.get("href"):
                university_data["apply_link"] = apply_btn["href"]

        return university_data

    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None
    except Exception as e:
        print(f"Error parsing {url}: {e}")
        return None


def store_in_supabase(data):
    """Store scraped university data in Supabase."""
    if not data or not data.get("name"):
        print("No valid data to store in Supabase.")
        return None

    try:
        existing = db.table("universities").select("id").eq("name", data["name"]).execute()

        row_data = {
            "name": data["name"],
            "description": data.get("description", ""),
            "url": data.get("url", ""),
            "apply_link": data.get("apply_link", ""),
            "admission_open": data.get("admission_open", True),
            "basic_info": data.get("basic_info", {}),
            "programs": data.get("programs", {}),
            "scholarships": data.get("scholarships", {}),
            "facilities": data.get("facilities", {}),
            "scraped_at": datetime.utcnow().isoformat(),
        }

        if existing.data:
            doc_id = existing.data[0]["id"]
            db.table("universities").update(row_data).eq("id", doc_id).execute()
            print(f"Updated {data['name']} in Supabase (ID: {doc_id})")
            return doc_id
        else:
            result = db.table("universities").insert(row_data).execute()
            doc_id = result.data[0]["id"]
            print(f"Inserted {data['name']} into Supabase (ID: {doc_id})")
            return doc_id

    except Exception as e:
        print(f"Error storing data in Supabase: {e}")
        return None


def display_data(data):
    """Display scraped university data."""
    if not data:
        print("No data to display.")
        return

    print(f"\n=== University Information: {data['url']} ===")
    print(f"Name: {data['name']}")

    print("\nBasic Information:")
    if data["basic_info"]:
        for key, value in data["basic_info"].items():
            print(f"  {key}: {value}")

    print("\nDescription:")
    print(f"  {data['description'] or 'No description available.'}")

    print("\nOffered Programs:")
    if data["programs"]:
        for category, programs in data["programs"].items():
            print(f"  {category}:")
            for i, program in enumerate(programs, 1):
                print(f"    {i}. {program}")

    print("\nAdmission:")
    print(f"  Apply Link: {data['apply_link'] or 'No apply link available.'}")


def scrape_all_universities():
    """Main function to scrape all universities and store in Supabase."""
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    fro

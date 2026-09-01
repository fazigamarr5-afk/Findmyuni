# app/routers/scraper.py
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from app.services.scraper_service import scrape_all_universities
from app.services.qau_scraper import scrape_qau_university, store_qau_in_supabase
from app.config.supabase import get_supabase
from app.utils.auth_middleware import get_admin_user
from datetime import datetime
import time
import logging

router = APIRouter()
db = get_supabase()
logger = logging.getLogger(__name__)

@router.post("/")
async def trigger_scraper(
    background_tasks: BackgroundTasks,
    admin = Depends(get_admin_user)  # Only admins can trigger scraping
):
    """
    Trigger the scraping process to run in the background.
    Returns a task ID that can be used to check the status.
    """
    # Create a new scrape task record in Supabase
    task_id = str(int(time.time()))
    task_data = {
        "status": "started",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": admin.get("uid")
    }
    
    db.table("scrape_jobs").insert({"id": task_id, **task_data}).execute()
    
    # Run the scraping process in the background
    background_tasks.add_task(run_scraper, task_id)
    
    return {"message": "Scraping task started", "task_id": task_id}

@router.get("/{task_id}")
async def get_scrape_task_status(
    task_id: str,
    admin = Depends(get_admin_user)  # Only admins can check task status
):
    """Get the status of a scraping task."""
    task = (db.table("scrape_jobs").select("*").eq("id", task_id).execute().data or [None])[0]
    if not task:
        raise HTTPException(status_code=404, detail="Scrape task not found")
    return task

@router.get("/")
async def get_all_scrape_tasks(
    admin = Depends(get_admin_user)  # Only admins can get all tasks
):
    """Get all scraping tasks."""
    tasks = (db.table("scrape_jobs").select("*").execute().data or [])
    return {"tasks": tasks}

def run_scraper(task_id: str):
    """Run the scraper and update the task status."""
    try:
        # Run the scraper
        start_time = time.time()
        universities = scrape_all_universities()
        end_time = time.time()
        
        # Update the task status to completed
        db.table("scrape_jobs").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "universities_scraped": len(universities),
            "execution_time_seconds": end_time - start_time
        }).eq("id", task_id).execute()
    except Exception as e:
        # Update the task status to failed
        db.table("scrape_jobs").update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", task_id).execute() 

@router.post("/qau")
async def trigger_qau_scraper(
    background_tasks: BackgroundTasks
):
    """
    Trigger the QAU-specific scraping process to run in the background.
    Returns a task ID that can be used to check the status.
    """
    # Create a new scrape task record in Supabase
    task_id = f"qau-{int(time.time())}"
    task_data = {
        "status": "started",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": "web_interface",
        "university": "Quaid-i-Azam University (QAU)"
    }
    
    db.table("scrape_jobs").insert({"id": task_id, **task_data}).execute()
    
    # Run the QAU scraping process in the background
    background_tasks.add_task(run_qau_scraper, task_id)
    
    return {"message": "QAU scraping task started", "task_id": task_id}

def run_qau_scraper(task_id: str):
    """Run the QAU scraper and update the task status."""
    try:
        # Run the scraper
        start_time = time.time()
        qau_data = scrape_qau_university()
        
        if qau_data:
            # Store in Supabase
            doc_id = store_qau_in_supabase(db, qau_data)
            
            # Update task status
            end_time = time.time()
            db.table("scrape_jobs").update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "universities_scraped": 1,
                "execution_time_seconds": end_time - start_time,
                "university_id": doc_id
            }).eq("id", task_id).execute()
            logger.info(f"QAU scraper task {task_id} completed successfully")
        else:
            # Update task status to failed
            db.table("scrape_jobs").update({
                "status": "failed",
                "error": "Failed to scrape QAU data",
                "completed_at": datetime.utcnow().isoformat()
            }).eq("id", task_id).execute()
            logger.error(f"QAU scraper task {task_id} failed to retrieve data")
    except Exception as e:
        # Update the task status to failed
        db.table("scrape_jobs").update({
            "status": "failed",
            "error": str(e),
            "completed_at": datetime.utcnow().isoformat()
        }).eq("id", task_id).execute()
        logger.error(f"Error in QAU scraper task {task_id}: {e}")

# Add a new public endpoint with no auth middleware
@router.post("/qau-direct")
async def trigger_qau_scraper_direct(
    background_tasks: BackgroundTasks
):
    """
    Public endpoint to trigger QAU scraping with no authentication required.
    """
    logger.info("Direct QAU scraping triggered")
    # Create a new scrape task record in Supabase
    task_id = f"qau-direct-{int(time.time())}"
    task_data = {
        "status": "started",
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "universities_scraped": 0,
        "triggered_by": "direct_public_access",
        "university": "Quaid-i-Azam University (QAU)"
    }
    
    db.table("scrape_jobs").insert({"id": task_id, **task_data}).execute()
    
    # Run the QAU scraping process in the background
    background_tasks.add_task(run_qau_scraper, task_id)
    
    return {"message": "QAU scraping task started", "task_id": task_id}
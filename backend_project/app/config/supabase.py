import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

_supabase_client = None

def get_supabase():
    """Get or create a Supabase client singleton."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise ValueError(
            "Supabase credentials not found. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) in your environment."
        )

    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        logger.info(f"Supabase client initialized for {url}")
        return _supabase_client
    except ImportError:
        raise ImportError(
            "supabase package not installed. Run: pip install supabase"
        )

def get_supabase_url():
    """Get the Supabase URL for frontend reference."""
    return os.getenv("SUPABASE_URL", "")

def get_supabase_anon_key():
    """Get the Supabase anon key for frontend reference."""
    return os.getenv("SUPABASE_ANON_KEY", "")

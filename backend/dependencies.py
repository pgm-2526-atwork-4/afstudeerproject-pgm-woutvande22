import os
from dotenv import load_dotenv
from supabase import create_client, Client
from postgrest import APIResponse

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")


def get_supabase() -> Client:
    """Return a fresh Supabase client instance."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def safe_maybe_single(query) -> APIResponse:
    """Execute a maybe_single() query, returning an APIResponse with data=[]
    when no rows are found (HTTP 204) instead of raising an APIError or returning None."""
    try:
        result = query.maybe_single().execute()
        # Some versions/contexts return None instead of raising when no row found
        if result is None:
            return APIResponse(data=[], count=None)
        return result
    except Exception as e:
        # supabase-py v2 raises APIError with code '204' when no row is found
        if getattr(e, "code", None) == "204" or "Missing response" in str(e):
            return APIResponse(data=[], count=None)
        raise

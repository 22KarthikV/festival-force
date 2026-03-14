from fastapi import APIRouter, HTTPException
from app.db.supabase_client import get_supabase_admin

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/{user_id}/{program_id}")
async def get_progress(user_id: str, program_id: str):
    db = get_supabase_admin()
    result = db.table("volunteer_progress").select("*").eq("user_id", user_id).eq("program_id", program_id).execute()

    if not result.data:
        return {
            "user_id": user_id,
            "program_id": program_id,
            "completed_modules": [],
            "xp_earned": 0,
            "level": 1,
            "assessment_passed": False,
            "shift_ready": False,
        }

    return result.data[0]


@router.get("/{user_id}")
async def get_all_progress(user_id: str):
    db = get_supabase_admin()
    result = db.table("volunteer_progress").select("*").eq("user_id", user_id).execute()
    return result.data or []

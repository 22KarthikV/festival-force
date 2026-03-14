from fastapi import APIRouter, HTTPException
from app.db.supabase_client import get_supabase_admin
from app.agents.gamification_agent import calculate_level
from datetime import datetime

router = APIRouter(prefix="/api/passport", tags=["passport"])

LEVEL_TITLES = {1: "Trainee", 2: "Certified Volunteer", 3: "Festival Pro", 4: "Festival Expert"}


@router.get("/{user_id}")
async def get_passport(user_id: str):
    db = get_supabase_admin()

    user_result = db.table("users").select("*").eq("id", user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_result.data[0]

    progress_result = db.table("volunteer_progress").select("*").eq("user_id", user_id).execute()
    all_progress = progress_result.data or []

    total_xp = sum(p.get("xp_earned", 0) for p in all_progress)
    level, level_title = calculate_level(total_xp)

    badges_result = db.table("user_badges").select("*, badges(*)").eq("user_id", user_id).execute()
    badges = []
    for ub in (badges_result.data or []):
        badge = ub.get("badges", {})
        if badge:
            badges.append({
                "id": badge.get("id"),
                "name": badge.get("name"),
                "icon": badge.get("icon"),
                "description": badge.get("description"),
                "earned_at": ub.get("earned_at"),
            })

    certifications = []
    for prog in all_progress:
        if prog.get("assessment_passed"):
            program_result = db.table("training_programs").select("title, org_id").eq("id", prog["program_id"]).execute()
            if program_result.data:
                program = program_result.data[0]
                org_result = db.table("organizations").select("name").eq("id", program.get("org_id", "")).execute()
                org_name = org_result.data[0]["name"] if org_result.data else "Unknown Org"
                certifications.append({
                    "role": program["title"].replace(" Training Program", ""),
                    "org": org_name,
                    "score": prog.get("assessment_score"),
                    "passed_at": prog.get("completed_at") or prog.get("started_at"),
                })

    readiness_scores = [p.get("assessment_score", 0) for p in all_progress if p.get("assessment_passed")]
    readiness_score = int(sum(readiness_scores) / len(readiness_scores)) if readiness_scores else 0

    shift_ready = any(p.get("shift_ready") for p in all_progress)

    return {
        "volunteer_id": user_id,
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "avatar_url": user.get("avatar_url"),
        "shift_ready": shift_ready,
        "readiness_score": readiness_score,
        "certifications": certifications,
        "badges": badges,
        "xp": total_xp,
        "level": level,
        "level_title": level_title,
        "verified_at": datetime.utcnow().isoformat() + "Z" if shift_ready else None,
    }

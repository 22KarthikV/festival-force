from typing import List, Optional
from app.db.supabase_client import get_supabase_admin

LEVEL_THRESHOLDS = [
    (0, 1, "Trainee"),
    (200, 2, "Certified Volunteer"),
    (500, 3, "Festival Pro"),
    (1000, 4, "Festival Expert"),
]

XP_RULES = {
    "complete_module": 50,
    "pass_quiz_first": 100,
    "pass_quiz_retry": 50,
    "pass_assessment": 200,
    "perfect_assessment": 100,  # bonus
}


def calculate_level(xp: int) -> tuple[int, str]:
    level, title = 1, "Trainee"
    for threshold, lvl, ttl in LEVEL_THRESHOLDS:
        if xp >= threshold:
            level, title = lvl, ttl
    return level, title


async def award_xp(user_id: str, program_id: str, event: str) -> dict:
    db = get_supabase_admin()

    result = db.table("volunteer_progress").select("*").eq("user_id", user_id).eq("program_id", program_id).execute()

    if not result.data:
        db.table("volunteer_progress").insert({
            "user_id": user_id,
            "program_id": program_id,
        }).execute()
        result = db.table("volunteer_progress").select("*").eq("user_id", user_id).eq("program_id", program_id).execute()

    progress = result.data[0]
    current_xp = progress.get("xp_earned", 0)
    current_level = progress.get("level", 1)

    xp_gained = XP_RULES.get(event, 0)
    new_xp = current_xp + xp_gained
    new_level, level_title = calculate_level(new_xp)
    leveled_up = new_level > current_level

    db.table("volunteer_progress").update({
        "xp_earned": new_xp,
        "level": new_level,
    }).eq("user_id", user_id).eq("program_id", program_id).execute()

    return {
        "xp_gained": xp_gained,
        "total_xp": new_xp,
        "level": new_level,
        "level_title": level_title,
        "leveled_up": leveled_up,
    }


async def check_and_award_badges(
    user_id: str,
    program_id: str,
    role_name: str,
    assessment_score: Optional[int] = None,
    quiz_perfect: bool = False,
    module_name: str = "",
) -> List[dict]:
    db = get_supabase_admin()

    progress = db.table("volunteer_progress").select("*").eq("user_id", user_id).eq("program_id", program_id).execute()
    prog = progress.data[0] if progress.data else {}

    existing = db.table("user_badges").select("badge_id").eq("user_id", user_id).execute()
    existing_ids = {b["badge_id"] for b in (existing.data or [])}

    all_badges = db.table("badges").select("*").execute()
    badges_map = {b["name"]: b for b in (all_badges.data or [])}

    earned = []

    def award(badge_name: str):
        badge = badges_map.get(badge_name)
        if badge and badge["id"] not in existing_ids:
            db.table("user_badges").insert({
                "user_id": user_id,
                "badge_id": badge["id"],
                "program_id": program_id,
            }).execute()
            earned.append(badge)
            existing_ids.add(badge["id"])

    role_lower = role_name.lower()
    if assessment_score is not None:
        if "bartend" in role_lower or "bar" in role_lower:
            award("Certified Bartender")
        if "ticket" in role_lower:
            award("Ticket Desk Specialist")

    if assessment_score == 100:
        award("Perfect Score")

    if prog.get("shift_ready") and (assessment_score or 0) >= 90:
        award("Rush Hour Ready")

    if prog.get("level", 1) >= 3:
        award("Festival Pro")

    if quiz_perfect and "safety" in module_name.lower():
        award("Safety Certified")

    return earned


async def mark_module_complete(user_id: str, program_id: str, module_id: str) -> None:
    db = get_supabase_admin()
    result = db.table("volunteer_progress").select("completed_modules").eq("user_id", user_id).eq("program_id", program_id).execute()

    if result.data:
        completed = result.data[0].get("completed_modules") or []
        if module_id not in completed:
            completed.append(module_id)
            db.table("volunteer_progress").update({
                "completed_modules": completed,
                "current_module_id": module_id,
            }).eq("user_id", user_id).eq("program_id", program_id).execute()

from fastapi import APIRouter, HTTPException
from app.db.supabase_client import get_supabase_admin
from app.agents.gamification_agent import calculate_level

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/employer/{org_id}")
async def get_employer_dashboard(org_id: str):
    db = get_supabase_admin()

    programs_result = db.table("training_programs").select("id,title").eq("org_id", org_id).execute()
    programs = programs_result.data or []
    program_ids = [p["id"] for p in programs]

    # Find volunteers via enrollment in org's programs (not by org_id, since volunteers don't set org_id)
    enrolled_result = db.table("volunteer_progress").select("user_id").in_("program_id", program_ids).execute() if program_ids else None
    volunteer_ids = list(set([r["user_id"] for r in (enrolled_result.data or [])])) if enrolled_result else []

    volunteers_result = db.table("users").select("id,full_name,email,avatar_url").in_("id", volunteer_ids).eq("role", "volunteer").execute() if volunteer_ids else None
    volunteers = volunteers_result.data if volunteers_result else []

    volunteer_data = []
    shift_ready_count = 0

    for v in volunteers:
        progress_result = db.table("volunteer_progress").select("*").eq("user_id", v["id"]).execute()
        all_prog = progress_result.data or []

        total_xp = sum(p.get("xp_earned", 0) for p in all_prog)
        level, level_title = calculate_level(total_xp)
        completed_programs = [p for p in all_prog if p.get("assessment_passed")]
        is_shift_ready = any(p.get("shift_ready") for p in all_prog)

        if is_shift_ready:
            shift_ready_count += 1

        org_programs_progress = [p for p in all_prog if p.get("program_id") in program_ids]
        completion_rate = (len(completed_programs) / len(programs) * 100) if programs else 0

        volunteer_data.append({
            **v,
            "xp": total_xp,
            "level": level,
            "level_title": level_title,
            "shift_ready": is_shift_ready,
            "completed_programs": len(completed_programs),
            "total_programs": len(programs),
            "completion_rate": round(completion_rate, 1),
        })

    avg_completion = (
        sum(v["completion_rate"] for v in volunteer_data) / len(volunteer_data)
        if volunteer_data else 0
    )

    return {
        "total_volunteers": len(volunteers),
        "shift_ready_count": shift_ready_count,
        "avg_completion_rate": round(avg_completion, 1),
        "active_programs": len(programs),
        "volunteers": volunteer_data,
        "programs": programs,
    }


@router.get("/leaderboard/{org_id}")
async def get_leaderboard(org_id: str):
    db = get_supabase_admin()

    # Find volunteers via enrollment in org's programs
    prog_ids_result = db.table("training_programs").select("id").eq("org_id", org_id).execute()
    prog_ids = [p["id"] for p in (prog_ids_result.data or [])]
    enrolled_result = db.table("volunteer_progress").select("user_id").in_("program_id", prog_ids).execute() if prog_ids else None
    vol_ids = list(set([r["user_id"] for r in (enrolled_result.data or [])])) if enrolled_result else []
    volunteers_result = db.table("users").select("id,full_name,email").in_("id", vol_ids).eq("role", "volunteer").execute() if vol_ids else None
    volunteers = volunteers_result.data if volunteers_result else []

    leaderboard = []
    for v in volunteers:
        progress_result = db.table("volunteer_progress").select("xp_earned,level,shift_ready").eq("user_id", v["id"]).execute()
        all_prog = progress_result.data or []

        total_xp = sum(p.get("xp_earned", 0) for p in all_prog)
        level, level_title = calculate_level(total_xp)
        shift_ready = any(p.get("shift_ready") for p in all_prog)

        badges_count_result = db.table("user_badges").select("id", count="exact").eq("user_id", v["id"]).execute()
        badges_count = badges_count_result.count or 0

        leaderboard.append({
            "user_id": v["id"],
            "full_name": v.get("full_name", "Anonymous"),
            "xp": total_xp,
            "level": level,
            "level_title": level_title,
            "shift_ready": shift_ready,
            "badges_count": badges_count,
        })

    leaderboard.sort(key=lambda x: x["xp"], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return leaderboard


@router.post("/rush-mode/{org_id}/activate")
async def activate_rush_mode(org_id: str):
    """Returns top shift-ready volunteers sorted by readiness score."""
    db = get_supabase_admin()

    # Find volunteers via enrollment in org's programs
    prog_ids_result = db.table("training_programs").select("id").eq("org_id", org_id).execute()
    prog_ids = [p["id"] for p in (prog_ids_result.data or [])]
    enrolled_result = db.table("volunteer_progress").select("user_id").in_("program_id", prog_ids).execute() if prog_ids else None
    vol_ids = list(set([r["user_id"] for r in (enrolled_result.data or [])])) if enrolled_result else []
    volunteers_result = db.table("users").select("id,full_name,email").in_("id", vol_ids).eq("role", "volunteer").execute() if vol_ids else None
    volunteers = volunteers_result.data if volunteers_result else []

    rush_candidates = []
    for v in volunteers:
        progress_result = db.table("volunteer_progress").select("xp_earned,assessment_score,shift_ready,program_id").eq("user_id", v["id"]).execute()
        all_prog = progress_result.data or []

        if not any(p.get("shift_ready") for p in all_prog):
            continue

        total_xp = sum(p.get("xp_earned", 0) for p in all_prog)
        level, level_title = calculate_level(total_xp)
        scores = [p.get("assessment_score", 0) for p in all_prog if p.get("shift_ready")]
        avg_score = sum(scores) / len(scores) if scores else 0

        rush_candidates.append({
            "user_id": v["id"],
            "full_name": v.get("full_name", "Anonymous"),
            "xp": total_xp,
            "level": level,
            "level_title": level_title,
            "avg_score": round(avg_score, 1),
            "shift_ready": True,
        })

    rush_candidates.sort(key=lambda x: (x["avg_score"], x["xp"]), reverse=True)

    return {
        "rush_mode_active": True,
        "top_volunteers": rush_candidates[:10],
        "total_shift_ready": len(rush_candidates),
    }

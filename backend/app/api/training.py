from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.db.supabase_client import get_supabase_admin
from app.agents.orchestrator import generate_training_for_role
from app.agents.gamification_agent import award_xp, check_and_award_badges, mark_module_complete
from app.models.schemas import (
    GenerateTrainingRequest,
    QuizSubmitRequest,
    QuizSubmitResponse,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
)

router = APIRouter(prefix="/api", tags=["training"])


@router.post("/training/generate")
async def generate_training(req: GenerateTrainingRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_training_for_role, req.role_id, req.org_id, req.role_name)
    return {"status": "generating", "message": "Training generation started"}


@router.post("/training/generate/sync")
async def generate_training_sync(req: GenerateTrainingRequest):
    try:
        program_id = await generate_training_for_role(req.role_id, req.org_id, req.role_name)
        return {"status": "complete", "program_id": program_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/training/{program_id}")
async def get_training_program(program_id: str):
    db = get_supabase_admin()
    result = db.table("training_programs").select("*").eq("id", program_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Program not found")
    return result.data[0]


@router.get("/training/{program_id}/modules")
async def list_modules(program_id: str):
    db = get_supabase_admin()
    result = db.table("modules").select("*").eq("program_id", program_id).order("order_index").execute()
    return result.data or []


@router.get("/modules/{module_id}")
async def get_module(module_id: str):
    db = get_supabase_admin()
    result = db.table("modules").select("*").eq("id", module_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Module not found")
    return result.data[0]


@router.get("/modules/{module_id}/quiz")
async def get_module_quiz(module_id: str):
    db = get_supabase_admin()
    result = db.table("quizzes").select("*").eq("module_id", module_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return result.data[0]


@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str):
    db = get_supabase_admin()
    result = db.table("quizzes").select("*").eq("id", quiz_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz = result.data[0]
    # Remove correct answers from response
    questions = quiz.get("questions", [])
    sanitized = []
    for q in questions:
        sanitized.append({
            "question": q["question"],
            "options": q["options"],
        })
    return {"id": quiz_id, "module_id": quiz["module_id"], "questions": sanitized}


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizSubmitResponse)
async def submit_quiz(quiz_id: str, req: QuizSubmitRequest):
    db = get_supabase_admin()
    result = db.table("quizzes").select("*").eq("id", quiz_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz = result.data[0]
    questions = quiz.get("questions", [])

    correct = 0
    for i, q in enumerate(questions):
        user_answer = req.answers.get(str(i))
        if user_answer and user_answer.upper() == q.get("correct", "").upper():
            correct += 1

    total = len(questions)
    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= 70

    # Get module for XP + badge context
    module_result = db.table("modules").select("title,program_id").eq("id", quiz["module_id"]).execute()
    module = module_result.data[0] if module_result.data else {}

    xp_result = {"xp_gained": 0}
    if passed and module.get("program_id"):
        event = "pass_quiz_first" if not req.is_retry else "pass_quiz_retry"
        xp_result = await award_xp(req.user_id, module["program_id"], event)
        await mark_module_complete(req.user_id, module["program_id"], quiz["module_id"])

        # Module complete XP
        await award_xp(req.user_id, module["program_id"], "complete_module")

    return QuizSubmitResponse(
        score=score,
        passed=passed,
        xp_awarded=xp_result.get("xp_gained", 0),
        correct_answers=correct,
        total_questions=total,
    )


@router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str):
    db = get_supabase_admin()
    result = db.table("assessments").select("*").eq("id", assessment_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = result.data[0]
    questions = assessment.get("questions", [])
    sanitized = [{"question": q["question"], "options": q["options"]} for q in questions]
    return {
        "id": assessment_id,
        "program_id": assessment["program_id"],
        "questions": sanitized,
        "pass_score": assessment["pass_score"],
    }


@router.get("/training/{program_id}/assessment")
async def get_program_assessment(program_id: str):
    db = get_supabase_admin()
    result = db.table("assessments").select("*").eq("program_id", program_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
    assessment = result.data[0]
    questions = assessment.get("questions", [])
    sanitized = [{"question": q["question"], "options": q["options"]} for q in questions]
    return {
        "id": assessment["id"],
        "program_id": program_id,
        "questions": sanitized,
        "pass_score": assessment["pass_score"],
    }


@router.post("/assessments/{assessment_id}/submit", response_model=AssessmentSubmitResponse)
async def submit_assessment(assessment_id: str, req: AssessmentSubmitRequest):
    db = get_supabase_admin()
    result = db.table("assessments").select("*").eq("id", assessment_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = result.data[0]
    questions = assessment.get("questions", [])

    correct = 0
    for i, q in enumerate(questions):
        user_answer = req.answers.get(str(i))
        if user_answer and user_answer.upper() == q.get("correct", "").upper():
            correct += 1

    total = len(questions)
    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= assessment.get("pass_score", 70)

    xp_result = await award_xp(req.user_id, req.program_id, "pass_assessment")
    if score == 100:
        bonus = await award_xp(req.user_id, req.program_id, "perfect_assessment")
        xp_result["xp_gained"] += bonus.get("xp_gained", 0)

    shift_ready = passed and score >= 70

    # Update progress
    db.table("volunteer_progress").update({
        "assessment_score": score,
        "assessment_passed": passed,
        "shift_ready": shift_ready,
    }).eq("user_id", req.user_id).eq("program_id", req.program_id).execute()

    # Get role name for badge checking
    program_result = db.table("training_programs").select("role_id").eq("id", req.program_id).execute()
    role_name = ""
    if program_result.data:
        role_id = program_result.data[0].get("role_id")
        if role_id:
            role_result = db.table("roles").select("name").eq("id", role_id).execute()
            if role_result.data:
                role_name = role_result.data[0].get("name", "")

    badges = []
    if passed:
        badges = await check_and_award_badges(
            req.user_id,
            req.program_id,
            role_name,
            assessment_score=score,
        )

    return AssessmentSubmitResponse(
        score=score,
        passed=passed,
        xp_awarded=xp_result.get("xp_gained", 0),
        badges_earned=badges,
        shift_ready=shift_ready,
    )

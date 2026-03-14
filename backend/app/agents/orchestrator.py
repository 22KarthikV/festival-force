import asyncio
from app.db.vector_store import similarity_search
from app.db.supabase_client import get_supabase_admin
from app.agents import training_generator, quiz_generator, assessment_generator


async def generate_training_for_role(role_id: str, org_id: str, role_name: str) -> str:
    """
    Full pipeline: retrieve context → generate modules → generate quizzes + assessment → store → return program_id
    """
    db = get_supabase_admin()

    # 1. Retrieve relevant document chunks via vector similarity
    chunks = await similarity_search(role_name, org_id, k=20)
    context = "\n\n".join([c["chunk_text"] for c in chunks]) if chunks else ""

    # 2. Generate training modules (GPT-4o)
    modules = await training_generator.generate_modules(role_name, context)

    if not modules:
        raise ValueError("Training generation returned no modules")

    # 3. Create training program record
    program_title = f"{role_name} Training Program"
    program_result = db.table("training_programs").insert({
        "role_id": role_id,
        "org_id": org_id,
        "title": program_title,
        "description": f"AI-generated training for {role_name} role",
        "estimated_minutes": len(modules) * 10,
        "pass_score": 70,
    }).execute()

    program_id = program_result.data[0]["id"]

    # 4. Store modules and generate quizzes in parallel
    module_ids = []
    for i, module in enumerate(modules):
        mod_result = db.table("modules").insert({
            "program_id": program_id,
            "title": module["title"],
            "content": {
                "slides": module.get("slides", []),
                "learning_objectives": module.get("learning_objectives", []),
            },
            "order_index": i,
            "xp_reward": 50,
        }).execute()
        module_ids.append((mod_result.data[0]["id"], module))

    # 5. Generate quizzes for each module + final assessment in parallel
    quiz_tasks = [quiz_generator.generate_quiz(m) for _, m in module_ids]
    assessment_task = assessment_generator.generate_assessment(modules, context)

    results = await asyncio.gather(*quiz_tasks, assessment_task, return_exceptions=True)

    quiz_results = results[:-1]
    assessment_questions = results[-1]

    # 6. Store quizzes
    for (module_id, _), questions in zip(module_ids, quiz_results):
        if isinstance(questions, Exception):
            questions = []
        db.table("quizzes").insert({
            "module_id": module_id,
            "questions": questions,
        }).execute()

    # 7. Store final assessment
    if not isinstance(assessment_questions, Exception):
        db.table("assessments").insert({
            "program_id": program_id,
            "questions": assessment_questions,
            "pass_score": 70,
        }).execute()

    return program_id

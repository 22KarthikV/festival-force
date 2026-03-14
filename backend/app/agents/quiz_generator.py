import json
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
_openai = AsyncOpenAI(
    api_key=settings.openai_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

SYSTEM_PROMPT = """You are a quiz designer for hospitality training.
Given training module content, generate 5 multiple-choice questions.

Output ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "correct": "A",
      "explanation": "Why this answer is correct"
    }
  ]
}

Rules:
- Questions must test practical knowledge, not just memory
- All 4 options must be plausible
- Explanations should reinforce learning
- Do NOT include any text outside the JSON"""


async def generate_quiz(module: dict) -> dict:
    module_text = f"Title: {module['title']}\n"
    for slide in module.get("slides", []):
        module_text += f"\n{slide['title']}: {slide['content']}\n"
        if slide.get("key_points"):
            module_text += "Key points: " + ", ".join(slide["key_points"]) + "\n"

    response = await _openai.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Generate a quiz for this module:\n\n{module_text}"},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return data.get("questions", [])

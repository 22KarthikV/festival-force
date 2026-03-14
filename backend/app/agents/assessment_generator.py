import json
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
_openai = AsyncOpenAI(
    api_key=settings.openai_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

SYSTEM_PROMPT = """You are a professional assessment designer for hospitality training.
Generate a 10-question final assessment covering all training modules provided.

Output ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text?",
      "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"},
      "correct": "A",
      "explanation": "Why this answer is correct",
      "difficulty": "easy"
    }
  ]
}

Rules:
- Generate exactly 10 questions
- Mix difficulty: 3 easy, 5 medium, 2 hard
- Cover all modules proportionally
- Focus on practical scenarios a worker would face
- Pass score is 70%
- Do NOT include any text outside the JSON"""


async def generate_assessment(modules: list, context: str = "") -> dict:
    modules_text = ""
    for i, module in enumerate(modules, 1):
        modules_text += f"\nModule {i}: {module['title']}\n"
        for slide in module.get("slides", []):
            modules_text += f"  - {slide['title']}: {slide['content'][:300]}\n"

    response = await _openai.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Generate a final assessment for these training modules:\n{modules_text}",
            },
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return data.get("questions", [])

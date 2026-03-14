import json
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
_openai = AsyncOpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = """You are a professional training content designer for the hospitality and events industry.
Given a job role and company policy documents, generate structured training modules.

Output ONLY valid JSON in this exact format:
{
  "modules": [
    {
      "title": "Module Title",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Main content paragraph",
          "key_points": ["Point 1", "Point 2", "Point 3"]
        }
      ],
      "learning_objectives": ["Objective 1", "Objective 2"]
    }
  ]
}

Rules:
- Generate 3-5 modules, each covering one distinct topic
- Each module should have 3-5 slides
- Keep slides concise, practical, and role-specific
- Use information from the provided documents when available
- Make content relevant to festival/event hospitality
- Do NOT include any text outside the JSON"""


async def generate_modules(role_name: str, context: str) -> list:
    user_message = f"""Role: {role_name}

Company Documents Context:
{context[:8000]}

Generate comprehensive training modules for this role. Use the document context to make the training specific and accurate."""

    response = await _openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return data.get("modules", [])

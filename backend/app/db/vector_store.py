from typing import List
from openai import AsyncOpenAI
from app.db.supabase_client import get_supabase_admin
from app.core.config import get_settings

settings = get_settings()
_openai = AsyncOpenAI(api_key=settings.openai_api_key)


async def embed_text(text: str) -> List[float]:
    response = await _openai.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


async def store_chunks(document_id: str, chunks: List[str]) -> None:
    db = get_supabase_admin()
    records = []
    for i, chunk in enumerate(chunks):
        embedding = await embed_text(chunk)
        records.append({
            "document_id": document_id,
            "chunk_text": chunk,
            "embedding": embedding,
            "chunk_index": i,
        })
    db.table("document_chunks").insert(records).execute()


async def similarity_search(query: str, org_id: str, k: int = 20) -> List[dict]:
    embedding = await embed_text(query)
    db = get_supabase_admin()
    result = db.rpc(
        "match_document_chunks",
        {
            "query_embedding": embedding,
            "org_id": org_id,
            "match_count": k,
        },
    ).execute()
    return result.data or []

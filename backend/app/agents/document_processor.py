import io
import re
from typing import List
from app.db.vector_store import store_chunks
from app.db.supabase_client import get_supabase_admin


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
        i += chunk_size - overlap
    return chunks


def _clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        import pdfplumber
        import io
        pages = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
        return _clean_text("\n".join(pages))
    except Exception as e:
        raise ValueError(f"PDF extraction failed: {e}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return _clean_text("\n".join(paragraphs))
    except Exception as e:
        raise ValueError(f"DOCX extraction failed: {e}")


def extract_text_from_txt(file_bytes: bytes) -> str:
    return _clean_text(file_bytes.decode("utf-8", errors="ignore"))


def extract_text(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return extract_text_from_txt(file_bytes)
    else:
        return extract_text_from_txt(file_bytes)


async def process_document(document_id: str, filename: str, file_bytes: bytes) -> int:
    """Extract text, chunk, embed, and store. Returns number of chunks."""
    db = get_supabase_admin()

    text = extract_text(filename, file_bytes)

    db.table("documents").update({
        "content_text": text[:50000],
        "processed": False,
    }).eq("id", document_id).execute()

    chunks = _chunk_text(text)

    # Store with embeddings
    await store_chunks(document_id, chunks)

    # Mark as processed
    db.table("documents").update({"processed": True}).eq("id", document_id).execute()

    return len(chunks)

import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from app.db.supabase_client import get_supabase_admin
from app.agents.document_processor import process_document
from app.models.schemas import DocumentUploadResponse, DocumentProcessResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    org_id: str = Form(...),
):
    db = get_supabase_admin()
    file_bytes = await file.read()

    storage_path = f"{org_id}/{uuid.uuid4()}_{file.filename}"

    try:
        db.storage.from_("documents").upload(storage_path, file_bytes, {
            "content-type": file.content_type or "application/octet-stream"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    result = db.table("documents").insert({
        "org_id": org_id,
        "filename": file.filename,
        "storage_path": storage_path,
        "processed": False,
    }).execute()

    doc = result.data[0]

    # Process in background
    background_tasks.add_task(process_document, doc["id"], file.filename, file_bytes)

    return DocumentUploadResponse(
        id=doc["id"],
        filename=doc["filename"],
        storage_path=doc["storage_path"],
        processed=False,
    )


@router.post("/{document_id}/process", response_model=DocumentProcessResponse)
async def trigger_process_document(document_id: str):
    db = get_supabase_admin()
    doc_result = db.table("documents").select("*").eq("id", document_id).execute()
    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = doc_result.data[0]

    try:
        file_bytes = db.storage.from_("documents").download(doc["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch file: {e}")

    chunks_count = await process_document(document_id, doc["filename"], file_bytes)

    return DocumentProcessResponse(
        document_id=document_id,
        chunks_stored=chunks_count,
        status="processed",
    )


@router.get("/{document_id}")
async def get_document(document_id: str):
    db = get_supabase_admin()
    result = db.table("documents").select("*").eq("id", document_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return result.data[0]


@router.get("/org/{org_id}")
async def list_org_documents(org_id: str):
    db = get_supabase_admin()
    result = db.table("documents").select("id,filename,processed,created_at").eq("org_id", org_id).order("created_at", desc=True).execute()
    return result.data or []

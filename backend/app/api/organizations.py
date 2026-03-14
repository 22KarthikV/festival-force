from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db.supabase_client import get_supabase_admin

router = APIRouter(prefix="/api", tags=["organizations"])


class CreateOrgRequest(BaseModel):
    name: str
    user_id: str


@router.post("/organizations")
async def create_organization(body: CreateOrgRequest):
    """Create an organization and link it to the employer user. Uses service role to bypass RLS."""
    db = get_supabase_admin()

    # Create the organization
    org_result = db.table("organizations").insert({"name": body.name}).execute()
    if not org_result.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")

    org = org_result.data[0]
    org_id = org["id"]

    # Link to the user
    db.table("users").update({"org_id": org_id}).eq("id", body.user_id).execute()

    return {"org_id": org_id, "name": org["name"]}

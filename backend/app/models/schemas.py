from pydantic import BaseModel, UUID4
from typing import Optional, List, Any
from datetime import datetime


class OrganizationCreate(BaseModel):
    name: str
    type: str = "hospitality"


class OrganizationOut(BaseModel):
    id: str
    name: str
    type: str
    created_at: datetime


class UserOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    org_id: Optional[str]
    avatar_url: Optional[str]


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    storage_path: str
    processed: bool


class DocumentProcessResponse(BaseModel):
    document_id: str
    chunks_stored: int
    status: str


class GenerateTrainingRequest(BaseModel):
    role_id: str
    org_id: str
    role_name: str


class TrainingProgramOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    estimated_minutes: int
    pass_score: int
    created_at: datetime


class ModuleOut(BaseModel):
    id: str
    program_id: str
    title: str
    content: dict
    order_index: int
    xp_reward: int


class QuizOut(BaseModel):
    id: str
    module_id: str
    questions: List[dict]


class AssessmentOut(BaseModel):
    id: str
    program_id: str
    questions: List[dict]
    pass_score: int


class QuizSubmitRequest(BaseModel):
    user_id: str
    answers: dict  # {question_index: "A"|"B"|"C"|"D"}
    is_retry: bool = False


class QuizSubmitResponse(BaseModel):
    score: int
    passed: bool
    xp_awarded: int
    correct_answers: int
    total_questions: int


class AssessmentSubmitRequest(BaseModel):
    user_id: str
    program_id: str
    answers: dict


class AssessmentSubmitResponse(BaseModel):
    score: int
    passed: bool
    xp_awarded: int
    badges_earned: List[dict]
    shift_ready: bool


class ProgressOut(BaseModel):
    user_id: str
    program_id: str
    completed_modules: List[str]
    xp_earned: int
    level: int
    assessment_passed: bool
    shift_ready: bool


class PassportOut(BaseModel):
    volunteer_id: str
    full_name: str
    shift_ready: bool
    readiness_score: int
    certifications: List[dict]
    badges: List[dict]
    xp: int
    level: int
    level_title: str
    verified_at: Optional[datetime]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    full_name: str
    xp: int
    level: int
    level_title: str
    shift_ready: bool
    badges_count: int


class DashboardStats(BaseModel):
    total_volunteers: int
    shift_ready_count: int
    avg_completion_rate: float
    active_programs: int
    volunteers: List[dict]

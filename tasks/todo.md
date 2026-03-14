# FestivalForce — Build Checklist

## Phase 1: Foundations ✅
- [x] `supabase/migrations/001_initial_schema.sql` — DB schema + RLS + vector function
- [x] `backend/requirements.txt` + `backend/app/core/config.py`
- [x] `backend/app/db/supabase_client.py` + `vector_store.py`
- [x] `frontend/package.json` + Next.js 14 scaffold

## Phase 2: Core Pipeline ✅
- [x] `backend/app/agents/document_processor.py` — PDF/DOCX/TXT extraction + chunking
- [x] `backend/app/agents/training_generator.py` — GPT-4o module generation
- [x] `backend/app/agents/quiz_generator.py` — GPT-4o-mini quiz generation
- [x] `backend/app/agents/assessment_generator.py` — Final assessment generation
- [x] `backend/app/agents/orchestrator.py` — Full pipeline coordination
- [x] `backend/app/api/documents.py` — Upload + process endpoints
- [x] `backend/app/api/training.py` — Training, quiz, assessment endpoints

## Phase 3: Frontend ✅
- [x] `/` — Landing page
- [x] `/auth/login` + `/auth/register` — Auth pages
- [x] `/employer/upload` — Document upload with drag & drop
- [x] `/employer/dashboard` — Stats, generate training, rush mode
- [x] `/training/[programId]` — Program overview + XP bar
- [x] `/training/[programId]/module/[moduleId]` — Slide carousel
- [x] `/training/[programId]/quiz/[quizId]` — Quiz flow
- [x] `/training/[programId]/assessment` — Final assessment
- [x] `/passport/[userId]` — Shift-ready passport

## Phase 4: Gamification ✅
- [x] `backend/app/agents/gamification_agent.py` — XP, levels, badges
- [x] `backend/app/api/passport.py` — Passport assembly
- [x] `backend/app/api/dashboard.py` — Employer dashboard + leaderboard + rush mode
- [x] `/leaderboard` — XP rankings

## Pre-Demo Checklist
- [ ] Add `.env` files with real Supabase + OpenAI keys
- [ ] Run `supabase db push` or run SQL migration manually
- [ ] Create Supabase storage bucket named `documents`
- [ ] `npm install` in frontend/
- [ ] `pip install -r requirements.txt` in backend/
- [ ] Seed demo data (employer + volunteer accounts, sample documents)
- [ ] Test full flow: upload → generate → complete → passport

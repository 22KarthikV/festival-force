# FestivalForce 🎪

AI-powered onboarding & training platform for temporary hospitality workers at events like the Edinburgh Fringe Festival.

## Quick Start

### 1. Supabase Setup
1. Create a new Supabase project at supabase.com
2. Run the migration: copy `supabase/migrations/001_initial_schema.sql` into the Supabase SQL Editor and run it
3. Create a storage bucket named `documents` (public bucket)
4. Copy your project URL, anon key, and service role key

### 2. Backend (FastAPI)
```bash
cd backend
cp .env.example .env
# Fill in .env with your Supabase + OpenAI keys
pip install -r requirements.txt
uvicorn app.main:app --reload
# API docs at http://localhost:8000/docs
```

### 3. Frontend (Next.js)
```bash
cd frontend
cp .env.local.example .env.local
# Fill in .env.local with your Supabase keys + backend URL
npm install
npm run dev
# App at http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-...
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Architecture

```
Employer uploads PDF → FastAPI backend → PyMuPDF extracts text
                     → OpenAI embeds chunks → Supabase pgvector stores
                     → GPT-4o generates 3-5 modules
                     → GPT-4o-mini generates quizzes + assessment
                     → Stored in Supabase DB

Volunteer logs in → Sees training programs
                 → Completes slide modules
                 → Takes quizzes → earns XP
                 → Passes final assessment → earns badges
                 → Gets Shift-Ready Passport

Employer dashboard → Sees volunteer completion rates
                  → Rush Mode → top shift-ready volunteers
```

## Deployment

- **Frontend**: Vercel (`cd frontend && vercel deploy`)
- **Backend**: Railway (push to GitHub, connect Railway to repo, set env vars)

## Demo Flow
1. Register as employer → upload `Staff_Handbook.pdf`
2. Generate training for "Bartender" role
3. Register as volunteer → complete Module 1 → take quiz
4. Pass final assessment → earn 🍸 Certified Bartender badge
5. View Shift-Ready Passport
6. Back on employer dashboard → see volunteer as "Shift Ready ✅"
7. Click Rush Mode → volunteer appears in top list

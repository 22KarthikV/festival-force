-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Organizations (employers)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'hospitality',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (employers + volunteers)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('employer', 'volunteer')) NOT NULL,
  org_id UUID REFERENCES organizations(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  content_text TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks + embeddings (vector store)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536),
  chunk_index INTEGER
);

-- Roles defined per organization
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT
);

-- AI-generated training programs per role
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id),
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  pass_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training modules (slides/content)
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER,
  xp_reward INTEGER DEFAULT 50
);

-- Quizzes per module
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'
);

-- Final assessments per program
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]',
  pass_score INTEGER DEFAULT 70
);

-- Volunteer progress tracking
CREATE TABLE volunteer_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  program_id UUID REFERENCES training_programs(id),
  completed_modules UUID[] DEFAULT '{}',
  current_module_id UUID,
  xp_earned INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  assessment_score INTEGER,
  assessment_passed BOOLEAN DEFAULT FALSE,
  shift_ready BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, program_id)
);

-- Badges catalog
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  criteria TEXT,
  xp_threshold INTEGER
);

-- Earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  badge_id UUID REFERENCES badges(id),
  program_id UUID REFERENCES training_programs(id),
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector similarity search RPC function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  org_id UUID,
  match_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  chunk_index INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_text,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.org_id = match_document_chunks.org_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Seed default badges
INSERT INTO badges (name, description, icon, criteria, xp_threshold) VALUES
  ('Certified Bartender', 'Passed the bartender assessment', '🍸', 'pass_bartender_assessment', 0),
  ('Ticket Desk Specialist', 'Passed the ticket desk assessment', '🎟', 'pass_ticket_assessment', 0),
  ('Safety Certified', 'Completed safety module with 100% quiz score', '🚨', 'safety_module_perfect', 0),
  ('Rush Hour Ready', 'Shift ready with score above 90%', '⚡', 'shift_ready_90', 0),
  ('Festival Pro', 'Reached Level 3', '🏆', 'reach_level_3', 500),
  ('Perfect Score', '100% on final assessment', '⭐', 'perfect_assessment', 0);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Org members can read org" ON organizations FOR SELECT USING (
  id IN (SELECT org_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Employers can manage documents" ON documents FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role = 'employer')
);
CREATE POLICY "Volunteers can read documents" ON documents FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can read chunks" ON document_chunks FOR SELECT USING (TRUE);
CREATE POLICY "Employers can manage chunks" ON document_chunks FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read roles" ON roles FOR SELECT USING (TRUE);
CREATE POLICY "Employers can manage roles" ON roles FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role = 'employer')
);

CREATE POLICY "Anyone can read programs" ON training_programs FOR SELECT USING (TRUE);
CREATE POLICY "Employers can manage programs" ON training_programs FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid() AND role = 'employer')
);

CREATE POLICY "Anyone can read modules" ON modules FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read quizzes" ON quizzes FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read assessments" ON assessments FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can read badges" ON badges FOR SELECT USING (TRUE);

CREATE POLICY "Users can manage own progress" ON volunteer_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Employers can read volunteer progress" ON volunteer_progress FOR SELECT USING (TRUE);

CREATE POLICY "Users can read own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Employers can read badges" ON user_badges FOR SELECT USING (TRUE);
CREATE POLICY "System can award badges" ON user_badges FOR INSERT WITH CHECK (TRUE);

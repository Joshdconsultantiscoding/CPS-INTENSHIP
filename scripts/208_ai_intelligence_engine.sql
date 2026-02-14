-- ============================================================
-- AI Intelligence Engine – Database Schema
-- Migration 208: Creates tables for knowledge base, vector
-- search, decision logging, warnings, and AI settings.
-- NOTE: profiles.id is TEXT (Clerk user IDs), not UUID
-- ============================================================

-- Enable pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. AI Settings (singleton row per workspace)
-- Stores encrypted API key, system instructions, personality
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_encrypted TEXT, -- AES-256-GCM encrypted
  ai_provider TEXT NOT NULL DEFAULT 'openai', -- openai | google | anthropic
  model_name TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
  system_instructions TEXT DEFAULT '',
  personality_config JSONB DEFAULT '{
    "tone": "professional",
    "authority_style": "firm_but_fair",
    "escalation_enabled": true,
    "discipline_framework": "progressive",
    "custom_rules": []
  }'::jsonb,
  autonomous_mode BOOLEAN NOT NULL DEFAULT false,
  autonomous_config JSONB DEFAULT '{
    "monitor_deadlines": true,
    "monitor_submissions": true,
    "monitor_activity": true,
    "auto_warn": false,
    "auto_grade": false
  }'::jsonb,
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT REFERENCES profiles(id)
);

-- ============================================================
-- 2. AI Knowledge Documents
-- Stores metadata for uploaded documents (global + per-intern)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT, -- Cloudinary or storage URL
  file_size_bytes BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT 'text/plain',

  -- Document classification
  doc_scope TEXT NOT NULL CHECK (doc_scope IN ('global', 'intern')),
  doc_type TEXT NOT NULL CHECK (doc_type IN (
    'internship_plan', 'internship_agreement', 'qa_document',
    'learning_plan', 'expectation_plan', 'earning_plan',
    'comprehensive_plan', 'other'
  )),
  authority_level INTEGER NOT NULL DEFAULT 1
    CHECK (authority_level BETWEEN 1 AND 3),
    -- 1 = highest (global master), 2 = intern profile, 3 = supplementary

  -- Per-intern linkage (NULL for global docs)
  intern_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,

  -- Processing state
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'indexed', 'error')),
  chunk_count INTEGER DEFAULT 0,
  error_message TEXT,
  raw_text TEXT, -- extracted full text

  -- Metadata
  uploaded_by TEXT REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_docs_scope ON ai_knowledge_documents(doc_scope);
CREATE INDEX idx_ai_docs_intern ON ai_knowledge_documents(intern_id) WHERE intern_id IS NOT NULL;
CREATE INDEX idx_ai_docs_type ON ai_knowledge_documents(doc_type);
CREATE INDEX idx_ai_docs_status ON ai_knowledge_documents(status);

-- ============================================================
-- 3. AI Document Chunks (with vector embeddings)
-- Each chunk is a piece of a document with its embedding
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES ai_knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER DEFAULT 0,

  -- Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),

  -- Inherited metadata for fast filtering
  doc_scope TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  authority_level INTEGER NOT NULL DEFAULT 1,
  intern_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,

  -- Chunk metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_chunks_doc ON ai_document_chunks(document_id);
CREATE INDEX idx_ai_chunks_scope ON ai_document_chunks(doc_scope);
CREATE INDEX idx_ai_chunks_intern ON ai_document_chunks(intern_id) WHERE intern_id IS NOT NULL;

-- ============================================================
-- 4. Vector Search RPC Function
-- Matches query embedding against stored chunks
-- ============================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 10,
  filter_scope TEXT DEFAULT NULL,
  filter_intern_id TEXT DEFAULT NULL,
  filter_doc_type TEXT DEFAULT NULL,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INTEGER,
  doc_scope TEXT,
  doc_type TEXT,
  authority_level INTEGER,
  intern_id TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    c.chunk_index,
    c.doc_scope,
    c.doc_type,
    c.authority_level,
    c.intern_id,
    c.metadata,
    1 - (c.embedding <=> query_embedding)::FLOAT AS similarity
  FROM ai_document_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_scope IS NULL OR c.doc_scope = filter_scope)
    AND (filter_intern_id IS NULL OR c.intern_id = filter_intern_id)
    AND (filter_doc_type IS NULL OR c.doc_type = filter_doc_type)
    AND (1 - (c.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- 5. AI Decision Logs (audit trail)
-- Every AI decision is logged with source references
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'chat_response', 'document_analysis', 'warning_issued',
    'course_generated', 'autonomous_decision', 'enforcement_action',
    'submission_review', 'escalation'
  )),
  input_summary TEXT, -- user query or trigger description
  output_summary TEXT, -- AI response or action taken
  full_response TEXT, -- complete AI output

  -- Source references (which knowledge was used)
  source_chunk_ids UUID[] DEFAULT '{}',
  authority_layers_used TEXT[] DEFAULT '{}',
  reasoning_context TEXT, -- the composed context sent to AI

  -- Context
  intern_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  triggered_by TEXT REFERENCES profiles(id), -- admin or system
  is_autonomous BOOLEAN DEFAULT false,

  -- Metadata
  model_used TEXT,
  token_count INTEGER DEFAULT 0,
  confidence_score FLOAT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_logs_type ON ai_decision_logs(action_type);
CREATE INDEX idx_ai_logs_intern ON ai_decision_logs(intern_id) WHERE intern_id IS NOT NULL;
CREATE INDEX idx_ai_logs_created ON ai_decision_logs(created_at DESC);

-- ============================================================
-- 6. AI Warnings (violation tracking)
-- Structured warnings with clause references
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  warning_number INTEGER NOT NULL DEFAULT 1, -- 1st, 2nd, 3rd warning
  severity TEXT NOT NULL DEFAULT 'minor'
    CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),

  -- Violation details
  violation_type TEXT NOT NULL,
  violation_description TEXT NOT NULL,
  violated_clause TEXT, -- reference to specific document clause
  source_document_id UUID REFERENCES ai_knowledge_documents(id),
  source_chunk_id UUID REFERENCES ai_document_chunks(id),

  -- Response
  action_taken TEXT, -- what the system did
  points_deducted INTEGER DEFAULT 0,
  requires_meeting BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  escalation_reason TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'acknowledged', 'resolved', 'escalated')),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT REFERENCES profiles(id),

  -- Audit
  issued_by TEXT REFERENCES profiles(id), -- admin or NULL for autonomous
  is_autonomous BOOLEAN DEFAULT false,
  decision_log_id UUID REFERENCES ai_decision_logs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_warnings_intern ON ai_warnings(intern_id);
CREATE INDEX idx_ai_warnings_status ON ai_warnings(status);
CREATE INDEX idx_ai_warnings_severity ON ai_warnings(severity);

-- ============================================================
-- RLS Policies: Admin-only access for all AI tables
-- ============================================================
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_warnings ENABLE ROW LEVEL SECURITY;

-- AI Settings: admin read/write
CREATE POLICY "Admin can manage AI settings"
  ON ai_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

-- Knowledge documents: admin full access
CREATE POLICY "Admin can manage knowledge documents"
  ON ai_knowledge_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

-- Document chunks: admin read access
CREATE POLICY "Admin can read document chunks"
  ON ai_document_chunks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

-- Decision logs: admin read access
CREATE POLICY "Admin can read decision logs"
  ON ai_decision_logs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

-- Warnings: admin full access, intern read own
CREATE POLICY "Admin can manage warnings"
  ON ai_warnings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()::text AND role = 'admin')
  );

CREATE POLICY "Intern can read own warnings"
  ON ai_warnings FOR SELECT
  USING (intern_id = auth.uid()::text);

-- ============================================================
-- Insert default AI settings row
-- ============================================================
INSERT INTO ai_settings (id, system_instructions)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'You operate as an institutional authority AI representing the Admin.
Your knowledge is strictly derived from:
- Internship Plan (Primary Authority)
- Internship Agreement (Legal Authority)
- Q&A Clarification Document
- Intern Profile Documents
- Admin Personality Instructions

You must enforce rules fairly, consistently, and professionally.
You must never invent rules.
You must escalate based on documented policies only.
You must cite the source document when making enforcement decisions.'
)
ON CONFLICT (id) DO NOTHING;

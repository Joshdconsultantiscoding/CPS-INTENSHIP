-- Migration 210: Multi-Provider AI Engine Support
-- Adds support for multiple cloud and local AI providers

-- 1. Create AI Providers table
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'openai', 'anthropic', 'ollama', etc.
    api_key_encrypted TEXT,
    base_url TEXT, -- Used for Ollama or Local LLM endpoints
    is_enabled BOOLEAN DEFAULT true,
    is_local BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    supported_features JSONB DEFAULT '{"vision": false, "files": false, "streaming": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add initial providers
INSERT INTO ai_providers (name, is_enabled, priority, is_local)
VALUES 
('openai', true, 1, false),
('anthropic', true, 2, false),
('google', true, 3, false),
('mistral', true, 4, false),
('cohere', true, 5, false),
('groq', true, 6, false),
('perplexity', true, 7, false),
('openrouter', true, 8, false),
('ollama', true, 9, true),
('local-llm', true, 10, true)
ON CONFLICT (name) DO NOTHING;

-- 3. Update AI Settings table
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS privacy_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_provider_id UUID REFERENCES ai_providers(id);

-- 4. Set default provider to OpenAI if it exists
UPDATE ai_settings 
SET default_provider_id = (SELECT id FROM ai_providers WHERE name = 'openai' LIMIT 1)
WHERE default_provider_id IS NULL;

-- 5. RLS Policies
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to ai_providers"
ON ai_providers FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()::text
    AND profiles.role = 'admin'
  )
);

-- Users (interns) cannot see providers (security for API keys)
-- But the edge functions/server actions will use the Admin Client

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled_priority ON ai_providers(is_enabled, priority);

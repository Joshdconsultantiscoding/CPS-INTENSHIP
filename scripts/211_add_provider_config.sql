-- Migration 211: Add model_name and custom_instructions to ai_providers
ALTER TABLE ai_providers 
ADD COLUMN IF NOT EXISTS model_name TEXT,
ADD COLUMN IF NOT EXISTS custom_instructions TEXT;

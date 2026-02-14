-- Migration 209: Intern Mandatory Document Submission
-- This migration adds the tracking table for intern documents and updates the profiles table.

-- 1. Create submission_status enum if it doesn't exist (using TEXT to keep it flexible)
-- 2. Create the intern_documents table
CREATE TABLE IF NOT EXISTS intern_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    learning_plan_url TEXT,
    expectation_plan_url TEXT,
    earning_plan_url TEXT,
    internship_plan_url TEXT,
    learning_plan_submitted_at TIMESTAMPTZ,
    expectation_plan_submitted_at TIMESTAMPTZ,
    earning_plan_submitted_at TIMESTAMPTZ,
    internship_plan_submitted_at TIMESTAMPTZ,
    submission_status TEXT DEFAULT 'incomplete' CHECK (submission_status IN ('incomplete', 'complete')),
    verified_by_admin BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    knowledge_indexed BOOLEAN DEFAULT false,
    indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(intern_id)
);

-- 3. Add documents_completed flag to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'documents_completed') THEN
        ALTER TABLE profiles ADD COLUMN documents_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Set up Row Level Security (RLS)
ALTER TABLE intern_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Interns can view and update their own document records
CREATE POLICY "Interns can manage their own documents"
    ON intern_documents
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = intern_id)
    WITH CHECK (auth.uid()::text = intern_id);

-- Policy: Admins can view and update all document records (for verification)
CREATE POLICY "Admins can view and update all documents"
    ON intern_documents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()::text
            AND profiles.role = 'admin'
        )
    );

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intern_documents_updated_at
    BEFORE UPDATE ON intern_documents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intern_documents_intern_id ON intern_documents(intern_id);
CREATE INDEX IF NOT EXISTS idx_intern_documents_status ON intern_documents(submission_status);
CREATE INDEX IF NOT EXISTS idx_profiles_documents_completed ON profiles(documents_completed);

COMMENT ON TABLE intern_documents IS 'Track mandatory document submissions for interns (Phase 1 onboarding compliance).';

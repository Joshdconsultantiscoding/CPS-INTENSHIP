-- =============================================================
-- Migration: call_logs table + notes table
-- Run this in your Supabase SQL Editor
-- =============================================================
-- 1. Call Logs Table
CREATE TABLE IF NOT EXISTS public.call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('missed', 'completed', 'rejected')),
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON public.call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver ON public.call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON public.call_logs(status);
-- RLS for call_logs
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own call logs" ON public.call_logs;
CREATE POLICY "Users can view their own call logs" ON public.call_logs FOR
SELECT USING (
        auth.uid()::text = caller_id
        OR auth.uid()::text = receiver_id
    );
DROP POLICY IF EXISTS "Users can insert call logs" ON public.call_logs;
CREATE POLICY "Users can insert call logs" ON public.call_logs FOR
INSERT WITH CHECK (auth.uid()::text = caller_id);
-- Allow service role full access (for server actions using admin client)
DROP POLICY IF EXISTS "Service role full access on call_logs" ON public.call_logs;
CREATE POLICY "Service role full access on call_logs" ON public.call_logs FOR ALL USING (auth.role() = 'service_role');
-- 2. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT DEFAULT '',
    source TEXT CHECK (
        source IN ('manual', 'message', 'ai', 'community')
    ),
    source_id TEXT,
    attachments TEXT [] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON public.notes(updated_at DESC);
-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
CREATE POLICY "Users can view their own notes" ON public.notes FOR
SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
CREATE POLICY "Users can insert their own notes" ON public.notes FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
CREATE POLICY "Users can update their own notes" ON public.notes FOR
UPDATE USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Service role full access on notes" ON public.notes;
CREATE POLICY "Service role full access on notes" ON public.notes FOR ALL USING (auth.role() = 'service_role');
-- 3. Ensure rejected status is allowed in messages.call_status
-- (The existing check constraint may only allow 'missed' | 'completed')
DO $$ BEGIN -- Drop old constraint if it exists
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_call_status_check;
-- Add updated constraint
ALTER TABLE public.messages
ADD CONSTRAINT messages_call_status_check CHECK (
        call_status IS NULL
        OR call_status IN ('missed', 'completed', 'rejected')
    );
EXCEPTION
WHEN OTHERS THEN RAISE NOTICE 'call_status constraint update skipped: %',
SQLERRM;
END $$;
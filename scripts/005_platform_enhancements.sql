-- =============================================
-- DEFINE TRIGGER FUNCTION IF NOT EXISTS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- =============================================
-- DROP AND RECREATE CALENDAR_EVENTS TABLE
-- =============================================
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view own events and public events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.calendar_events;
-- Drop existing table (if it exists)
DROP TABLE IF EXISTS public.calendar_events CASCADE;
-- Create the table with correct schema
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    event_type TEXT NOT NULL DEFAULT 'other' CHECK (
        event_type IN (
            'meeting',
            'deadline',
            'review',
            'reminder',
            'other'
        )
    ),
    location TEXT,
    attendees UUID [] DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- Enable RLS on calendar_events
-- =============================================
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
-- =============================================
-- RLS POLICIES FOR CALENDAR_EVENTS
-- =============================================
CREATE POLICY "Users can view own events and public events" ON public.calendar_events FOR
SELECT USING (
        auth.uid() = user_id
        OR is_public = true
        OR auth.uid() = ANY(attendees)
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Users can create own events" ON public.calendar_events FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.calendar_events FOR
UPDATE USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );
CREATE POLICY "Users can delete own events" ON public.calendar_events FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND role = 'admin'
    )
);
-- =============================================
-- ADD INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_is_public ON public.calendar_events(is_public);
-- =============================================
-- ADD TRIGGER FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_calendar_events_updated_at BEFORE
UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- =============================================
-- ADD STATUS COLUMN TO PROFILES IF NOT EXISTS
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
-- =============================================
-- ADD POINTS COLUMN TO TASKS IF NOT EXISTS
-- =============================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;
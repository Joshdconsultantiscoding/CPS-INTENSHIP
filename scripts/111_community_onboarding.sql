-- Community Onboarding Responses
-- Stores intern interest, goals, and pain points gathered during onboarding
CREATE TABLE IF NOT EXISTS public.community_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    niche_id UUID NOT NULL REFERENCES public.community_niches(id) ON DELETE CASCADE,
    interests TEXT NOT NULL,
    goals TEXT NOT NULL,
    pain_points TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS
ALTER TABLE public.community_onboarding_responses ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can create their own responses" ON public.community_onboarding_responses FOR
INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can view their own responses" ON public.community_onboarding_responses FOR
SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Admins can view all responses" ON public.community_onboarding_responses FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
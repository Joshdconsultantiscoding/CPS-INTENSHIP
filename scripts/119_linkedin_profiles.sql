-- LinkedIn-Style Profile System Schema
-- This migration extends profiles and adds experience, education, skills, projects, recommendations
-- =============================================
-- EXTEND PROFILES TABLE
-- =============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS headline TEXT,
    ADD COLUMN IF NOT EXISTS about TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT,
    ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS creator_mode BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS resume_url TEXT,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT;
-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
-- =============================================
-- EXPERIENCES TABLE (Work/Internship History)
-- =============================================
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_experiences_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_experiences_profile ON public.experiences(profile_id);
-- =============================================
-- EDUCATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    school TEXT NOT NULL,
    degree TEXT,
    field TEXT,
    description TEXT,
    start_year INTEGER,
    end_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_education_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_education_profile ON public.education(profile_id);
-- =============================================
-- SKILLS TABLE (with endorsements)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profile_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    endorsements_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_skills_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, skill_name)
);
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON public.profile_skills(profile_id);
-- Skill endorsements tracking
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_id UUID NOT NULL REFERENCES public.profile_skills(id) ON DELETE CASCADE,
    endorser_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_endorser FOREIGN KEY (endorser_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(skill_id, endorser_id)
);
-- =============================================
-- PROJECTS TABLE (Portfolio)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profile_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    link TEXT,
    tags TEXT [] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_projects_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_profile_projects_profile ON public.profile_projects(profile_id);
-- =============================================
-- RECOMMENDATIONS TABLE (Testimonials)
-- =============================================
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT NOT NULL,
    author_title TEXT,
    author_avatar_url TEXT,
    message TEXT NOT NULL,
    relationship TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_recommendations_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_author FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE
    SET NULL
);
CREATE INDEX IF NOT EXISTS idx_recommendations_profile ON public.recommendations(profile_id);
-- =============================================
-- FEATURED ITEMS TABLE (Featured content)
-- =============================================
CREATE TABLE IF NOT EXISTS public.featured_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (
        item_type IN (
            'link',
            'image',
            'video',
            'project',
            'certificate'
        )
    ),
    title TEXT NOT NULL,
    description TEXT,
    media_url TEXT,
    link TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_featured_profile FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_featured_items_profile ON public.featured_items(profile_id);
-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_items ENABLE ROW LEVEL SECURITY;
-- =============================================
-- RLS POLICIES - EXPERIENCES
-- =============================================
DROP POLICY IF EXISTS "Anyone can view experiences" ON public.experiences;
CREATE POLICY "Anyone can view experiences" ON public.experiences FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own experiences" ON public.experiences;
CREATE POLICY "Users can manage own experiences" ON public.experiences FOR ALL USING (profile_id = auth.uid()::text);
-- =============================================
-- RLS POLICIES - EDUCATION
-- =============================================
DROP POLICY IF EXISTS "Anyone can view education" ON public.education;
CREATE POLICY "Anyone can view education" ON public.education FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own education" ON public.education;
CREATE POLICY "Users can manage own education" ON public.education FOR ALL USING (profile_id = auth.uid()::text);
-- =============================================
-- RLS POLICIES - SKILLS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view skills" ON public.profile_skills;
CREATE POLICY "Anyone can view skills" ON public.profile_skills FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own skills" ON public.profile_skills;
CREATE POLICY "Users can manage own skills" ON public.profile_skills FOR ALL USING (profile_id = auth.uid()::text);
DROP POLICY IF EXISTS "Anyone can view endorsements" ON public.skill_endorsements;
CREATE POLICY "Anyone can view endorsements" ON public.skill_endorsements FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can endorse skills" ON public.skill_endorsements;
CREATE POLICY "Users can endorse skills" ON public.skill_endorsements FOR
INSERT WITH CHECK (endorser_id = auth.uid()::text);
DROP POLICY IF EXISTS "Users can remove own endorsements" ON public.skill_endorsements;
CREATE POLICY "Users can remove own endorsements" ON public.skill_endorsements FOR DELETE USING (endorser_id = auth.uid()::text);
-- =============================================
-- RLS POLICIES - PROJECTS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view projects" ON public.profile_projects;
CREATE POLICY "Anyone can view projects" ON public.profile_projects FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own projects" ON public.profile_projects;
CREATE POLICY "Users can manage own projects" ON public.profile_projects FOR ALL USING (profile_id = auth.uid()::text);
-- =============================================
-- RLS POLICIES - RECOMMENDATIONS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view approved recommendations" ON public.recommendations;
CREATE POLICY "Anyone can view approved recommendations" ON public.recommendations FOR
SELECT USING (
        status = 'approved'
        OR profile_id = auth.uid()::text
        OR author_id = auth.uid()::text
    );
DROP POLICY IF EXISTS "Users can request recommendations" ON public.recommendations;
CREATE POLICY "Users can request recommendations" ON public.recommendations FOR
INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Profile owners can manage recommendations" ON public.recommendations;
CREATE POLICY "Profile owners can manage recommendations" ON public.recommendations FOR
UPDATE USING (profile_id = auth.uid()::text);
DROP POLICY IF EXISTS "Authors or owners can delete" ON public.recommendations;
CREATE POLICY "Authors or owners can delete" ON public.recommendations FOR DELETE USING (
    profile_id = auth.uid()::text
    OR author_id = auth.uid()::text
);
-- =============================================
-- RLS POLICIES - FEATURED ITEMS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view featured items" ON public.featured_items;
CREATE POLICY "Anyone can view featured items" ON public.featured_items FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own featured items" ON public.featured_items;
CREATE POLICY "Users can manage own featured items" ON public.featured_items FOR ALL USING (profile_id = auth.uid()::text);
-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER update_experiences_updated_at BEFORE
UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_education_updated_at BEFORE
UPDATE ON public.education FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_profile_projects_updated_at BEFORE
UPDATE ON public.profile_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- =============================================
-- FUNCTION: Generate username from name
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_username(full_name TEXT, user_id TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE base_username TEXT;
final_username TEXT;
counter INTEGER := 0;
BEGIN -- Create base username from name (lowercase, remove spaces, replace with dots)
base_username := lower(
    regexp_replace(
        trim(COALESCE(full_name, 'user')),
        '\s+',
        '.',
        'g'
    )
);
-- Remove any non-alphanumeric characters except dots
base_username := regexp_replace(base_username, '[^a-z0-9.]', '', 'g');
-- Start with base username
final_username := base_username;
-- Keep incrementing until we find a unique username
WHILE EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE username = final_username
        AND id != user_id
) LOOP counter := counter + 1;
final_username := base_username || counter;
END LOOP;
RETURN final_username;
END;
$$;
-- =============================================
-- Update existing profiles with default usernames
-- =============================================
UPDATE public.profiles
SET username = public.generate_username(full_name, id)
WHERE username IS NULL;
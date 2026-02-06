-- Community Niches (Sub-communities) System
-- This script creates the structure for categorized community interaction
-- 1. Create Niches Table
CREATE TABLE IF NOT EXISTS public.community_niches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    -- Lucide icon name or Emoji
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT REFERENCES public.profiles(id)
);
-- 2. Update Posts to reference Niches
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS niche_id UUID REFERENCES public.community_niches(id) ON DELETE CASCADE;
-- 3. Niche Memberships (for tracking suspensions and preferred niches)
CREATE TABLE IF NOT EXISTS public.niche_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    niche_id UUID NOT NULL REFERENCES public.community_niches(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, niche_id)
);
-- 4. Enable RLS
ALTER TABLE public.community_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.niche_memberships ENABLE ROW LEVEL SECURITY;
-- 5. RLS Policies
-- Everyone can view active niches
CREATE POLICY "Anyone can view niches" ON public.community_niches FOR
SELECT USING (
        is_active = TRUE
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
-- Admins can do everything with niches
CREATE POLICY "Admins manage niches" ON public.community_niches FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    )
);
-- Niche Memberships
CREATE POLICY "Users view own memberships" ON public.niche_memberships FOR
SELECT USING (
        user_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
CREATE POLICY "Admins manage memberships" ON public.niche_memberships FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    )
);
-- Update Posts RLS to include niche checks (if needed, but usually selective by niche_id is enough)
-- 6. Insert Default Niches
INSERT INTO public.community_niches (name, description, icon)
VALUES (
        'AI & Automation',
        'Discuss the latest in AI, LLMs, and automation tools.',
        'Sparkles'
    ),
    (
        'VibeCoding',
        'Share your coding vibes, setups, and aesthetic development.',
        'Code2'
    ),
    (
        'Marketing',
        'Digital marketing strategies, SEO, and brand building.',
        'Megaphone'
    ),
    (
        'Content Creation',
        'Tips for creators, YouTubers, and writers.',
        'Video'
    ),
    (
        'Graphic Design',
        'Visual arts, UI/UX, and branding design.',
        'Palette'
    ),
    (
        'Music & Sound',
        'Music production, gear, and playlists.',
        'Music'
    ),
    (
        'Book Club',
        'Share what you are reading and discuss literary works.',
        'BookOpen'
    );
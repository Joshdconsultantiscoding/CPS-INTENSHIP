-- =============================================
-- COMMUNITY FEED SCHEMA
-- Posts, Comments, and Likes for social interaction
-- =============================================
-- Enable UUID extension (if not already)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- =============================================
-- POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_urls TEXT [] DEFAULT '{}',
    media_type TEXT CHECK (
        media_type IN ('image', 'video', 'mixed')
        OR media_type IS NULL
    ),
    visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'interns', 'admins')),
    is_pinned BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================
-- POST LIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure a user can only like a post once
    CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
    -- Ensure a user can only like a comment once  
    CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id),
    -- Ensure either post_id or comment_id is set, not both
    CONSTRAINT like_target_check CHECK (
        (
            post_id IS NOT NULL
            AND comment_id IS NULL
        )
        OR (
            post_id IS NULL
            AND comment_id IS NOT NULL
        )
    )
);
-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned)
WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
-- =============================================
-- RLS POLICIES FOR POSTS
-- =============================================
-- Everyone can view posts (visibility filtering done in queries)
CREATE POLICY "Anyone can view posts" ON public.posts FOR
SELECT USING (true);
-- Users can create posts
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR
INSERT WITH CHECK (true);
-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts FOR
UPDATE USING (
        author_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
-- Users can delete their own posts, admins can delete any post
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (
    author_id = auth.uid()::text
    OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    )
);
-- =============================================
-- RLS POLICIES FOR COMMENTS
-- =============================================
CREATE POLICY "Anyone can view comments" ON public.comments FOR
SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON public.comments FOR
UPDATE USING (
        author_id = auth.uid()::text
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()::text
                AND role = 'admin'
        )
    );
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (
    author_id = auth.uid()::text
    OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()::text
            AND role = 'admin'
    )
);
-- =============================================
-- RLS POLICIES FOR LIKES
-- =============================================
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR
SELECT USING (true);
CREATE POLICY "Users can create their own likes" ON public.post_likes FOR
INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can delete their own likes" ON public.post_likes FOR DELETE USING (user_id = auth.uid()::text);
-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_posts_updated_at BEFORE
UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE
UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- =============================================
-- FUNCTION TO UPDATE LIKE COUNTS
-- =============================================
CREATE OR REPLACE FUNCTION update_post_likes_count() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN IF NEW.post_id IS NOT NULL THEN
UPDATE public.posts
SET likes_count = likes_count + 1
WHERE id = NEW.post_id;
ELSIF NEW.comment_id IS NOT NULL THEN
UPDATE public.comments
SET likes_count = likes_count + 1
WHERE id = NEW.comment_id;
END IF;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN IF OLD.post_id IS NOT NULL THEN
UPDATE public.posts
SET likes_count = GREATEST(likes_count - 1, 0)
WHERE id = OLD.post_id;
ELSIF OLD.comment_id IS NOT NULL THEN
UPDATE public.comments
SET likes_count = GREATEST(likes_count - 1, 0)
WHERE id = OLD.comment_id;
END IF;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER update_likes_count_trigger
AFTER
INSERT
    OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();
-- =============================================
-- FUNCTION TO UPDATE COMMENT COUNTS
-- =============================================
CREATE OR REPLACE FUNCTION update_post_comments_count() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT' THEN
UPDATE public.posts
SET comments_count = comments_count + 1
WHERE id = NEW.post_id;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
UPDATE public.posts
SET comments_count = GREATEST(comments_count - 1, 0)
WHERE id = OLD.post_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER update_comments_count_trigger
AFTER
INSERT
    OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
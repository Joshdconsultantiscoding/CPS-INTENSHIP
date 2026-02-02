-- FIX SCRIPT FOR COMMUNITY FEED SCHEMA
-- Ensures that author_id and user_id columns are TEXT to match profiles.id (Clerk ID)
-- This fixes issues where they might have been created as UUIDs.
-- 1. Drop ALL dependent policies first (to clear dependencies)
DO $$ BEGIN -- Posts Policies
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
-- Comments Policies
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
-- Likes Policies
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
-- Drop Foreign Keys if they exist
IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_author_id_fkey'
) THEN
ALTER TABLE public.posts DROP CONSTRAINT posts_author_id_fkey;
END IF;
-- Comments
IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'comments_author_id_fkey'
) THEN
ALTER TABLE public.comments DROP CONSTRAINT comments_author_id_fkey;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'comments_author_id_fkey1'
) THEN
ALTER TABLE public.comments DROP CONSTRAINT comments_author_id_fkey1;
END IF;
-- Likes
IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'post_likes_user_id_fkey'
) THEN
ALTER TABLE public.post_likes DROP CONSTRAINT post_likes_user_id_fkey;
END IF;
END $$;
-- 2. Alter columns to TEXT (using ::text casting if needed)
-- We use a safe cast that works even if it's already text
ALTER TABLE public.posts
ALTER COLUMN author_id TYPE TEXT USING author_id::text;
ALTER TABLE public.comments
ALTER COLUMN author_id TYPE TEXT USING author_id::text;
ALTER TABLE public.post_likes
ALTER COLUMN user_id TYPE TEXT USING user_id::text;
-- 3. Re-add Foreign Key Constraints
ALTER TABLE public.posts
ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.comments
ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.post_likes
ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
-- 4. Verify/Update RLS Policies to ensure they cast to text
-- (Dropping and recreating is safer to ensure correct definition)
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts FOR
UPDATE USING (
        author_id = auth.uid()::text
        OR (
            select role
            from public.profiles
            where id = auth.uid()::text
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (
    author_id = auth.uid()::text
    OR (
        select role
        from public.profiles
        where id = auth.uid()::text
    ) = 'admin'
);
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR
UPDATE USING (
        author_id = auth.uid()::text
        OR (
            select role
            from public.profiles
            where id = auth.uid()::text
        ) = 'admin'
    );
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (
    author_id = auth.uid()::text
    OR (
        select role
        from public.profiles
        where id = auth.uid()::text
    ) = 'admin'
);
DROP POLICY IF EXISTS "Users can create their own likes" ON public.post_likes;
CREATE POLICY "Users can create their own likes" ON public.post_likes FOR
INSERT WITH CHECK (user_id = auth.uid()::text);
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
CREATE POLICY "Users can delete their own likes" ON public.post_likes FOR DELETE USING (user_id = auth.uid()::text);
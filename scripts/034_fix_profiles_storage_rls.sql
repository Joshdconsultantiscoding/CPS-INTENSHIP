-- Fix Storage RLS for Profiles (v2 - Fixed policy naming conflict)
-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'profiles',
        'profiles',
        true,
        5242880,
        ARRAY ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    ) ON CONFLICT (id) DO
UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
-- 2. Drop ALL existing policies that might conflict (using unique names)
DROP POLICY IF EXISTS "Authenticated users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to view all" ON storage.objects;
DROP POLICY IF EXISTS "Public Profiles Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
-- Drop profiles-specific policies
DROP POLICY IF EXISTS "profiles_bucket_upload" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_view" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_update" ON storage.objects;
DROP POLICY IF EXISTS "profiles_bucket_delete" ON storage.objects;
-- 3. Create permissive but secure policies with UNIQUE names
-- Allow authenticated users to upload to profiles bucket in their own folder
CREATE POLICY "profiles_bucket_upload" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'profiles'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Allow public read access to all profiles (avatars are public)
CREATE POLICY "profiles_bucket_view" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'profiles');
-- Allow users to update their own files in profiles bucket
CREATE POLICY "profiles_bucket_update" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'profiles'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Allow users to delete their own files in profiles bucket
CREATE POLICY "profiles_bucket_delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
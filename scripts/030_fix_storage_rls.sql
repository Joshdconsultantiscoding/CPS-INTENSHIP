-- Fix Storage RLS for Chat Attachments
-- 1. Ensure bucket exists and is public
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'chat-attachments',
        'chat-attachments',
        true,
        52428800,
        NULL
    ) -- 50MB limit
    ON CONFLICT (id) DO
UPDATE
SET public = true;
-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to view all" ON storage.objects;
-- 3. Create permissive but secure policies
-- Allow authenticated users to upload to their own folder defined by their user ID
-- Path convention: user_id/filename.ext
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'chat-attachments'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Allow authenticated users to view all files in the bucket (since it's a chat)
CREATE POLICY "Allow authenticated view" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'chat-attachments');
-- Allow users to update their own files
CREATE POLICY "Allow users to update own files" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'chat-attachments'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- TOTAL ACCESS VERSION: Phase 2 Storage Cleanup
-- This script removes all RLS barriers for storage to ensure profile and logo uploads work.
-- 1. Profiles Bucket (Public access for avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;
-- 2. Portal Assets Bucket (Public access for logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-assets', 'portal-assets', true) ON CONFLICT (id) DO NOTHING;
-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public portal-assets read access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage portal assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow all storage access" ON storage.objects;
-- Create ultra-permissive policies for the specific buckets
CREATE POLICY "Allow all storage access" ON storage.objects FOR ALL USING (bucket_id IN ('profiles', 'portal-assets')) WITH CHECK (bucket_id IN ('profiles', 'portal-assets'));
-- Grant full permissions to anonymous and authenticated users for storage
GRANT ALL ON storage.objects TO anon,
    authenticated,
    service_role;
GRANT ALL ON storage.buckets TO anon,
    authenticated,
    service_role;
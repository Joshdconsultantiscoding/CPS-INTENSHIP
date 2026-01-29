-- Create a storage bucket for chat attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments');
-- Policy: Anyone can view (assuming public bucket for simplicity, or restricted to auth)
CREATE POLICY "Authenticated users can view chat attachments" ON storage.objects FOR
SELECT TO authenticated USING (bucket_id = 'chat-attachments');
-- Policy: Users can update/delete their own files
CREATE POLICY "Users can update own chat attachments" ON storage.objects FOR
UPDATE TO authenticated USING (auth.uid() = owner);
CREATE POLICY "Users can delete own chat attachments" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);
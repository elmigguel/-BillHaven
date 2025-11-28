-- Run this in Supabase SQL Editor to create the storage bucket
-- Go to: https://supabase.com/dashboard/project/bldjdctgjhtucyxqhwpc/sql/new

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('bill-documents', 'bill-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bill-documents');

-- 3. Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bill-documents');

-- 4. Allow authenticated users to delete their files
CREATE POLICY IF NOT EXISTS "Allow authenticated delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bill-documents');

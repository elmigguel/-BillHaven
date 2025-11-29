-- Migration: Fix Storage SELECT Policy
-- Date: 2025-11-29
-- Issue: Storage policy was allowing ALL authenticated users to view ALL documents
-- Fix: Only allow users to view their own folder's documents

-- First, drop the old permissive policy
DROP POLICY IF EXISTS "Bill owners can view their documents" ON storage.objects;

-- Create the fixed policy
CREATE POLICY "Bill owners can view their documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bill-documents' AND
    (
      -- User can view their own documents (folder starts with user id)
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Admins can view all documents for dispute resolution
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- Verify the policy was created
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

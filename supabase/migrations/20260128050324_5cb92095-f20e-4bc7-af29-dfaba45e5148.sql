-- Make the videos bucket private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'videos';

-- Update SELECT policy to allow authenticated users to view all videos
-- (since signed URLs require authentication)
DROP POLICY IF EXISTS "Allow public read access to videos" ON storage.objects;

CREATE POLICY "Authenticated users can view videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'videos');
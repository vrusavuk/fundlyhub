-- Make fundraiser-drafts bucket public for browser image loading
UPDATE storage.buckets 
SET public = true 
WHERE id = 'fundraiser-drafts';

-- Update RLS policy to allow public read access for all fundraiser buckets including drafts
DROP POLICY IF EXISTS "Public read access for public fundraiser images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read draft images" ON storage.objects;

CREATE POLICY "Public read access for all fundraiser buckets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts'));
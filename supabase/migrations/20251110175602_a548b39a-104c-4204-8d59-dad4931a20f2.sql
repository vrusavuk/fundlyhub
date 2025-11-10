-- Create fundraiser images storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('fundraiser-images', 'fundraiser-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('fundraiser-gallery', 'fundraiser-gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('fundraiser-drafts', 'fundraiser-drafts', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects
CREATE POLICY "Users can upload their own fundraiser images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own fundraiser images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own fundraiser images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public read access for public fundraiser images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('fundraiser-images', 'fundraiser-gallery'));

CREATE POLICY "Authenticated users can read draft images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fundraiser-drafts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create fundraiser_images metadata table
CREATE TABLE IF NOT EXISTS public.fundraiser_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('cover', 'gallery', 'draft')),
  bucket TEXT NOT NULL CHECK (bucket IN ('fundraiser-images', 'fundraiser-gallery', 'fundraiser-drafts')),
  width INTEGER,
  height INTEGER,
  is_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_fundraiser_images_user ON public.fundraiser_images(user_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_images_fundraiser ON public.fundraiser_images(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_fundraiser_images_type ON public.fundraiser_images(image_type);
CREATE INDEX IF NOT EXISTS idx_fundraiser_images_deleted ON public.fundraiser_images(deleted_at) WHERE deleted_at IS NULL;

-- RLS Policies for fundraiser_images
ALTER TABLE public.fundraiser_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own images"
ON public.fundraiser_images FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view public fundraiser images"
ON public.fundraiser_images FOR SELECT
TO public
USING (fundraiser_id IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own images"
ON public.fundraiser_images FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own images"
ON public.fundraiser_images FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own images"
ON public.fundraiser_images FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Function to clean up abandoned draft images
CREATE OR REPLACE FUNCTION cleanup_abandoned_draft_images()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  image_record RECORD;
BEGIN
  FOR image_record IN
    SELECT id, storage_path, bucket
    FROM public.fundraiser_images
    WHERE image_type = 'draft'
      AND fundraiser_id IS NULL
      AND created_at < NOW() - INTERVAL '7 days'
      AND deleted_at IS NULL
  LOOP
    BEGIN
      PERFORM storage.delete_object(image_record.bucket, image_record.storage_path);
      
      UPDATE public.fundraiser_images
      SET deleted_at = NOW()
      WHERE id = image_record.id;
      
      deleted_count := deleted_count + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to delete image %: %', image_record.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

-- Create storage_analytics table for tracking metrics
CREATE TABLE IF NOT EXISTS public.storage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('upload', 'delete', 'optimize')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  bucket TEXT,
  image_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_analytics_user ON public.storage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_analytics_timestamp ON public.storage_analytics(timestamp);

ALTER TABLE public.storage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
ON public.storage_analytics FOR SELECT
TO authenticated
USING (user_id = auth.uid());
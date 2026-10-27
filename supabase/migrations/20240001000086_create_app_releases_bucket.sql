-- Migration 086: Create app-releases storage bucket for public APK downloads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-releases',
  'app-releases',
  true,
  104857600, -- 100 MB limit
  ARRAY['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip']
)
ON CONFLICT (id) DO UPDATE 
SET public = true, file_size_limit = 104857600;

-- Idempotent policy: Allow public read access to download files from app-releases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for App Releases'
  ) THEN
    CREATE POLICY "Public Access for App Releases"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'app-releases');
  END IF;
END $$;

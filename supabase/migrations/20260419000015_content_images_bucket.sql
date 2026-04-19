-- Storage bucket for blog/help content images. Public read, admin write.

BEGIN;

INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can read content images" ON storage.objects;
CREATE POLICY "Public can read content images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-images');

DROP POLICY IF EXISTS "Admins can upload content images" ON storage.objects;
CREATE POLICY "Admins can upload content images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update content images" ON storage.objects;
CREATE POLICY "Admins can update content images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete content images" ON storage.objects;
CREATE POLICY "Admins can delete content images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'content-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMIT;

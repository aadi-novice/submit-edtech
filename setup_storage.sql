-- Create storage bucket for courses
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('courses', 'courses', true, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for the courses bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for signed URLs" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Create policy for public read access (for signed URLs)
CREATE POLICY "Public read access for signed URLs" ON storage.objects
FOR SELECT 
USING (bucket_id = 'courses');

-- Create policy for service role full access
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL
USING (auth.role() = 'service_role');

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

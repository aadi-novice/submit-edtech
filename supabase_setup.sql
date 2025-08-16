-- Create storage bucket for courses
INSERT INTO storage.buckets (id, name, public) VALUES ('courses', 'courses', true);

-- Create policies for the courses bucket
CREATE POLICY "Public read access for signed URLs" ON storage.objects
FOR SELECT 
USING (bucket_id = 'courses');

CREATE POLICY "Service role full access" ON storage.objects
FOR ALL
USING (auth.role() = 'service_role');

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

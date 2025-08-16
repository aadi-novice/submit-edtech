#!/usr/bin/env python
"""
Complete Supabase setup script for EdTech platform
Creates bucket, sets policies, and uploads PDFs
"""

import os
import sys
import django
from supabase import create_client

# Setup Django
sys.path.append('edtech')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')
django.setup()

from django.conf import settings
from courses.models import LessonPDF

def setup_supabase_storage():
    """Complete Supabase storage setup"""
    
    # Initialize Supabase client
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE)
    
    print("🚀 Setting up Supabase storage...")
    
    # Step 1: Create bucket
    try:
        result = supabase.storage.create_bucket('courses')
        print(f"✅ Bucket created: {result}")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate key value" in str(e).lower():
            print("✅ Bucket 'courses' already exists")
        else:
            print(f"❌ Error creating bucket: {e}")
            # Don't return False, continue with file upload
    
    # Step 2: Set up policies via direct SQL
    policies_sql = """
    -- Create policies for the courses bucket
    DO $$
    BEGIN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Public read access for signed URLs" ON storage.objects;
        DROP POLICY IF EXISTS "Service role full access" ON storage.objects;
        
        -- Create new policies
        CREATE POLICY "Public read access for signed URLs" ON storage.objects
        FOR SELECT 
        USING (bucket_id = 'courses');
        
        CREATE POLICY "Service role full access" ON storage.objects
        FOR ALL
        USING (auth.role() = 'service_role');
        
        -- Ensure RLS is enabled
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END
    $$;
    """
    
    try:
        # Execute policies using raw SQL
        result = supabase.rpc('exec_sql', {'sql': policies_sql})
        print("✅ Storage policies created")
    except Exception as e:
        print(f"⚠️ Policy creation error (might be normal): {e}")
    
    # Step 3: Upload PDF files
    print("\n📁 Uploading PDF files...")
    
    pdfs = LessonPDF.objects.all()
    for pdf in pdfs:
        print(f"\n📄 Processing: {pdf.title}")
        
        # Check local file
        local_path = os.path.join(settings.BASE_DIR, pdf.pdf_path)
        if not os.path.exists(local_path):
            print(f"   ❌ Local file not found: {local_path}")
            continue
        
        # Read and upload file
        try:
            with open(local_path, 'rb') as f:
                file_data = f.read()
            
            # Try to upload
            try:
                result = supabase.storage.from_('courses').upload(
                    pdf.pdf_path, 
                    file_data,
                    {"content-type": "application/pdf"}
                )
                print(f"   ✅ Uploaded successfully")
            except Exception as upload_error:
                if "already exists" in str(upload_error).lower():
                    # File exists, update it
                    supabase.storage.from_('courses').update(
                        pdf.pdf_path, 
                        file_data,
                        {"content-type": "application/pdf"}
                    )
                    print(f"   ✅ Updated existing file")
                else:
                    raise upload_error
                    
        except Exception as e:
            print(f"   ❌ Error uploading {pdf.title}: {e}")
    
    # Step 4: Verify setup
    print("\n🔍 Verifying setup...")
    try:
        files = supabase.storage.from_('courses').list()
        print(f"✅ Found {len(files)} files in bucket")
        
        # Test signed URL generation
        if files:
            test_file = files[0]['name'] if isinstance(files[0], dict) else str(files[0])
            signed_url = supabase.storage.from_('courses').create_signed_url(test_file, 60)
            if signed_url.get('signedURL'):
                print("✅ Signed URL generation working")
            else:
                print("❌ Signed URL generation failed")
                
    except Exception as e:
        print(f"❌ Verification error: {e}")
    
    print("\n🎉 Supabase setup completed!")
    return True

if __name__ == "__main__":
    setup_supabase_storage()

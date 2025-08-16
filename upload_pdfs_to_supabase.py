#!/usr/bin/env python
"""
Script to upload local PDF files to Supabase storage
Run this AFTER creating the 'courses' bucket in Supabase dashboard
"""

import os
import sys
import django

# Setup Django
sys.path.append('edtech')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')
django.setup()

from courses.models import LessonPDF
from courses.storage import _client
from django.conf import settings

def upload_all_pdfs():
    """Upload all PDF files from local storage to Supabase"""
    
    if not _client:
        print("❌ Supabase client not available")
        return
    
    # Get all PDFs from database
    pdfs = LessonPDF.objects.all()
    print(f"Found {pdfs.count()} PDFs to upload")
    
    for pdf in pdfs:
        print(f"\n📄 Processing: {pdf.title}")
        print(f"   Path: {pdf.pdf_path}")
        
        # Check if local file exists
        local_path = os.path.join(settings.BASE_DIR, pdf.pdf_path)
        if not os.path.exists(local_path):
            print(f"   ❌ Local file not found: {local_path}")
            continue
            
        # Read file data
        try:
            with open(local_path, 'rb') as f:
                file_data = f.read()
            print(f"   📁 File size: {len(file_data)} bytes")
        except Exception as e:
            print(f"   ❌ Error reading file: {e}")
            continue
        
        # Upload to Supabase
        try:
            result = _client.storage.from_(settings.SUPABASE_BUCKET).upload(
                pdf.pdf_path, 
                file_data,
                {"content-type": "application/pdf"}
            )
            print(f"   ✅ Upload successful: {result}")
            
        except Exception as e:
            print(f"   ❌ Upload failed: {e}")
            
            # If file exists, try to update instead
            if "already exists" in str(e).lower():
                try:
                    # Remove existing file first
                    _client.storage.from_(settings.SUPABASE_BUCKET).remove([pdf.pdf_path])
                    # Then upload again
                    result = _client.storage.from_(settings.SUPABASE_BUCKET).upload(
                        pdf.pdf_path, 
                        file_data,
                        {"content-type": "application/pdf"}
                    )
                    print(f"   ✅ Update successful: {result}")
                except Exception as e2:
                    print(f"   ❌ Update also failed: {e2}")

if __name__ == "__main__":
    print("🚀 Starting PDF upload to Supabase...")
    print(f"📦 Bucket: {settings.SUPABASE_BUCKET}")
    print(f"🔗 Supabase URL: {settings.SUPABASE_URL}")
    
    upload_all_pdfs()
    print("\n🎉 Upload process completed!")

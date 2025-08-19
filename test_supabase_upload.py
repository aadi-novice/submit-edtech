#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / 'edtech'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edtech.settings')
django.setup()

# Now we can import Django modules
from courses.storage import upload_bytes, SUPABASE_AVAILABLE

def test_supabase():
    print('🧪 Testing Supabase upload...')
    
    if not SUPABASE_AVAILABLE:
        print('❌ Supabase client not available')
        print('💡 Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE environment variables')
        return
    
    # Create test data
    test_data = b"This is a test PDF file content"
    test_path = "test/test_upload.pdf"
    
    print(f'📤 Uploading test file to: {test_path}')
    
    # Try upload
    result = upload_bytes(test_path, test_data)
    
    if result:
        print(f'✅ Upload successful: {result}')
    else:
        print('❌ Upload failed')

if __name__ == "__main__":
    test_supabase()

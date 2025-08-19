from django.core.management.base import BaseCommand
from courses.storage import upload_bytes, SUPABASE_AVAILABLE
import io

class Command(BaseCommand):
    help = 'Test Supabase upload functionality'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🧪 Testing Supabase upload...'))
        
        if not SUPABASE_AVAILABLE:
            self.stdout.write(self.style.ERROR('❌ Supabase client not available'))
            return
        
        # Create test data
        test_data = b"This is a test PDF file content"
        test_path = "test/test_upload.pdf"
        
        self.stdout.write(f'📤 Uploading test file to: {test_path}')
        
        # Try upload
        result = upload_bytes(test_path, test_data)
        
        if result:
            self.stdout.write(self.style.SUCCESS(f'✅ Upload successful: {result}'))
        else:
            self.stdout.write(self.style.ERROR('❌ Upload failed'))

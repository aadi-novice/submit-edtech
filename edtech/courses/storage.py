import os, time
from django.conf import settings
from django.urls import reverse
from django.http import HttpResponse
import hashlib
import json
from datetime import datetime, timedelta

# Try to use Supabase if configured
try:
    from supabase import create_client
    if hasattr(settings, 'SUPABASE_URL') and settings.SUPABASE_URL:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE)
        SUPABASE_AVAILABLE = True
    else:
        SUPABASE_AVAILABLE = False
        _client = None
except (ImportError, Exception):
    SUPABASE_AVAILABLE = False
    _client = None

def upload_bytes(bucket_path, data):
    """Upload bytes data to Supabase storage bucket"""
    if not SUPABASE_AVAILABLE or not _client:
        print("❌ Supabase client not available")
        return None

    # Get bucket name from settings
    bucket_name = getattr(settings, 'SUPABASE_BUCKET', 'courses')

    # Check if bucket exists, try to create if not
    try:
        try:
            _client.storage.from_(bucket_name).list()
        except Exception as bucket_exc:
            print(f"⚠️ Bucket '{bucket_name}' not found or not accessible: {bucket_exc}")
            try:
                _client.storage.create_bucket(bucket_name, public=False)
                print(f"✅ Created bucket '{bucket_name}'")
            except Exception as create_exc:
                print(f"❌ Could not create bucket '{bucket_name}': {create_exc}")
                return None
    except Exception as e:
        print(f"❌ Supabase bucket check failed: {e}")
        return None

    try:
        print(f"� Attempting to upload to bucket: {bucket_name}")
        print(f"🔍 Attempting to upload to bucket_path: {bucket_path}")
        print(f"🔍 Data type: {type(data)}, Data size: {len(data) if hasattr(data, '__len__') else 'unknown'}")

        # Use the most compatible upload call for storage3
        result = _client.storage.from_(bucket_name).upload(bucket_path, data)
        print(f"✅ Upload successful: {result}")
        return result
    except Exception as e:
        print(f"❌ Upload failed. Error: {e}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return None

def signed_url(path_in_bucket: str, expires_sec: int = 60, bucket: str = None) -> str:
    if SUPABASE_AVAILABLE and _client:
        bucket = bucket or settings.SUPABASE_BUCKET
        res = _client.storage.from_(bucket).create_signed_url(path_in_bucket, expires_sec)
        return res.get("signedURL") or res.get("signed_url")
    else:
        # Local storage - generate a secure temporary URL
        return generate_local_signed_url(path_in_bucket, expires_sec)

def generate_local_signed_url(path_in_bucket: str, expires_sec: int = 60) -> str:
    """Generate a signed URL for local file access"""
    # Create expiration timestamp
    expires_at = datetime.utcnow() + timedelta(seconds=expires_sec)
    
    # Create signature
    secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
    signature_data = f"{path_in_bucket}:{expires_at.isoformat()}:{secret_key}"
    signature = hashlib.sha256(signature_data.encode()).hexdigest()[:16]
    
    # Build URL with Django URL reverse
    from django.urls import reverse
    try:
        base_url = reverse('secure_pdf_view', kwargs={'path': path_in_bucket.replace('/', '---')})
        return f"{base_url}?expires={int(expires_at.timestamp())}&signature={signature}"
    except:
        # Fallback to simple media URL
        return f"/media/{path_in_bucket}?t={signature}&expires={int(expires_at.timestamp())}"

def generate_secure_pdf_url(path_in_bucket: str, user_id: int, expires_sec: int = 300, bucket: str = None) -> str:
    """
    Generate a secure PDF URL with user-specific validation
    """
    if SUPABASE_AVAILABLE and _client:
        bucket = bucket or settings.SUPABASE_BUCKET
        try:
            # Create signed URL with longer expiration for better UX
            res = _client.storage.from_(bucket).create_signed_url(path_in_bucket, expires_sec)
            signed_url = res.get("signedURL") or res.get("signed_url")
            
            if not signed_url:
                print(f"❌ No signed URL returned from Supabase for {path_in_bucket}")
                raise Exception("No signed URL returned from Supabase")
            
            # Add user-specific token for validation
            validation_data = {
                'user_id': user_id,
                'path': path_in_bucket,
                'timestamp': datetime.utcnow().isoformat(),
                'expires': expires_sec
            }
            token = hashlib.sha256(json.dumps(validation_data, sort_keys=True).encode()).hexdigest()[:16]
            
            # Append validation token to URL
            if '?' in signed_url:
                signed_url += f"&validation_token={token}&user_id={user_id}"
            else:
                signed_url += f"?validation_token={token}&user_id={user_id}"
            
            return signed_url
        except Exception as e:
            print(f"❌ Error generating signed URL for PDF {path_in_bucket}: {e}")
            # Fall back to local storage if Supabase fails
            print(f"🔄 Falling back to local storage for {path_in_bucket}")
    
    # Local storage with enhanced security (either as fallback or primary)
    expires_at = datetime.utcnow() + timedelta(seconds=expires_sec)
    
    # Create user-specific signature
    secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
    signature_data = f"{user_id}:{path_in_bucket}:{expires_at.isoformat()}:{secret_key}"
    signature = hashlib.sha256(signature_data.encode()).hexdigest()[:20]
    
    # Generate secure local URL
    try:
        from django.urls import reverse
        
        # Use a better path encoding that avoids conflicts with existing underscores
        # Replace / with a unique separator like ---
        encoded_path = path_in_bucket.replace('/', '---')
        relative_url = reverse('secure_pdf_view', kwargs={'path': encoded_path})
        # Ensure we use the full Django backend URL
        full_url = f"http://localhost:8000{relative_url}?user_id={user_id}&expires={int(expires_at.timestamp())}&signature={signature}"
        return full_url
    except Exception as e:
        # Fallback URL with full domain
        print(f"❌ Error in URL generation: {e}")
        encoded_path = path_in_bucket.replace('/', '---')
        return f"http://localhost:8000/api/secure-pdf/{encoded_path}?user_id={user_id}&expires={int(expires_at.timestamp())}&signature={signature}"

def verify_pdf_access(path: str, user_id: int, expires: int, signature: str) -> bool:
    """Verify if a PDF access request is valid"""
    try:
        # Check expiration
        if datetime.utcnow().timestamp() > expires:
            return False
        
        # Verify signature
        secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
        expires_dt = datetime.fromtimestamp(expires)
        signature_data = f"{user_id}:{path}:{expires_dt.isoformat()}:{secret_key}"
        expected_signature = hashlib.sha256(signature_data.encode()).hexdigest()[:20]
        
        return signature == expected_signature
    except:
        return False

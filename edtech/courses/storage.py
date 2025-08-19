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
    
    try:
        print(f"🔍 Attempting to upload to bucket: {bucket_name}")
        print(f"🔍 Attempting to upload to bucket_path: {bucket_path}")
        print(f"🔍 Data type: {type(data)}, Data size: {len(data) if hasattr(data, '__len__') else 'unknown'}")
        
        # Method 1: Try with file_options parameter
        try:
            print("🔄 Trying upload with file_options...")
            result = _client.storage.from_(bucket_name).upload(
                path=bucket_path,
                file=data,
                file_options={"upsert": True}
            )
            print(f"✅ Upload successful with file_options: {result}")
            return result
        except Exception as e1:
            print(f"❌ Upload with file_options failed: {e1}")
            print(f"❌ Error type: {type(e1)}")
            
            # Method 2: Try without file_options
            try:
                print("🔄 Trying upload without file_options...")
                result = _client.storage.from_(bucket_name).upload(
                    path=bucket_path,
                    file=data
                )
                print(f"✅ Upload successful without file_options: {result}")
                return result
            except Exception as e2:
                print(f"❌ Upload without file_options failed: {e2}")
                print(f"❌ Error type: {type(e2)}")
                
                # Method 3: Try with different parameter names
                try:
                    print("🔄 Trying upload with upsert parameter...")
                    result = _client.storage.from_(bucket_name).upload(
                        file=data,
                        path=bucket_path,
                        upsert=True
                    )
                    print(f"✅ Upload successful with upsert parameter: {result}")
                    return result
                except Exception as e3:
                    print(f"❌ Upload with upsert parameter failed: {e3}")
                    print(f"❌ Error type: {type(e3)}")
                    
                    # Method 4: Try with update if exists
                    try:
                        print("🔄 Trying update if file exists...")
                        result = _client.storage.from_(bucket_name).update(
                            path=bucket_path,
                            file=data
                        )
                        print(f"✅ Update successful: {result}")
                        return result
                    except Exception as e4:
                        print(f"❌ Update failed: {e4}")
                        print(f"❌ Error type: {type(e4)}")
                        
                        # Final attempt: basic upload
                        print("🔄 Final attempt with basic upload...")
                        result = _client.storage.from_(bucket_name).upload(bucket_path, data)
                        print(f"✅ Basic upload successful: {result}")
                        return result
    
    except Exception as e:
        print(f"❌ All upload methods failed. Final error: {e}")
        print(f"❌ Error type: {type(e)}")
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

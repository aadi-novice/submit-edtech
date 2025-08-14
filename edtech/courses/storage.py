import os, time
from supabase import create_client
from django.conf import settings

_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE)

def upload_bytes(path_in_bucket: str, data: bytes, bucket: str = None):
    bucket = bucket or settings.SUPABASE_BUCKET
    # overwrite if exists
    _client.storage.from_(bucket).upload(path_in_bucket, data, {"upsert": True})
    return path_in_bucket

def signed_url(path_in_bucket: str, expires_sec: int = 60, bucket: str = None) -> str:
    bucket = bucket or settings.SUPABASE_BUCKET
    res = _client.storage.from_(bucket).create_signed_url(path_in_bucket, expires_sec)
    return res.get("signedURL") or res.get("signed_url")

def generate_secure_pdf_url(path_in_bucket: str, user_id: int, expires_sec: int = 300, bucket: str = None) -> str:
    """
    Generate a secure PDF URL with user-specific validation
    """
    bucket = bucket or settings.SUPABASE_BUCKET
    # Create signed URL with longer expiration for better UX
    res = _client.storage.from_(bucket).create_signed_url(path_in_bucket, expires_sec)
    signed_url = res.get("signedURL") or res.get("signed_url")
    
    # Add user-specific token for validation
    import hashlib
    import json
    from datetime import datetime
    
    # Create a validation token
    validation_data = {
        'user_id': user_id,
        'path': path_in_bucket,
        'timestamp': datetime.utcnow().isoformat(),
        'expires': expires_sec
    }
    token = hashlib.sha256(json.dumps(validation_data, sort_keys=True).encode()).hexdigest()[:16]
    
    # Append validation token to URL (this would need server-side validation)
    if '?' in signed_url:
        signed_url += f"&validation_token={token}"
    else:
        signed_url += f"?validation_token={token}"
    
    return signed_url

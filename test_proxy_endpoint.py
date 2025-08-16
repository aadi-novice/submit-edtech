#!/usr/bin/env python
import requests
import json

def test_proxy_endpoint():
    """Test the proxy-pdf endpoint with authentication"""
    base_url = "http://localhost:8000"
    
    # First, login to get JWT token
    login_data = {
        "username": "student",
        "password": "student123"
    }
    
    print("🔐 Logging in...")
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token_data = login_response.json()
    access_token = token_data.get('access')
    
    if not access_token:
        print("❌ No access token received")
        return
    
    print(f"✅ Login successful, got token: {access_token[:20]}...")
    
    # Test the proxy endpoint
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/pdf'
    }
    
    proxy_url = f"{base_url}/api/proxy-pdf/1"
    print(f"\n📄 Testing proxy endpoint: {proxy_url}")
    
    try:
        response = requests.get(proxy_url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type', 'Not set')}")
        print(f"Content Length: {response.headers.get('Content-Length', 'Not set')}")
        
        if response.status_code == 200:
            print("✅ Proxy endpoint working correctly!")
            if 'application/pdf' in response.headers.get('Content-Type', ''):
                print("✅ PDF content type confirmed")
            else:
                print(f"⚠️  Unexpected content type: {response.headers.get('Content-Type')}")
        else:
            print(f"❌ Request failed with status: {response.status_code}")
            print(f"Response text: {response.text[:500]}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == '__main__':
    test_proxy_endpoint()

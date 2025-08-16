#!/usr/bin/env python
import requests
import json

def test_frontend_endpoint():
    """Test the endpoint that the frontend actually calls"""
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
    
    # Test the frontend endpoint (what the frontend actually calls)
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    frontend_url = f"{base_url}/api/lessonpdfs/1/view_pdf/"
    print(f"\n📄 Testing frontend endpoint: {frontend_url}")
    
    try:
        response = requests.get(frontend_url, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type', 'Not set')}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Frontend endpoint working correctly!")
            data = response.json()
            
            if 'signed_url' in data:
                print(f"✅ Got signed URL: {data['signed_url']}")
                
                # Test the returned proxy URL
                print(f"\n🔗 Testing returned proxy URL: {data['signed_url']}")
                proxy_headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/pdf'
                }
                
                proxy_response = requests.get(data['signed_url'], headers=proxy_headers, timeout=10)
                print(f"Proxy Status Code: {proxy_response.status_code}")
                print(f"Proxy Content Type: {proxy_response.headers.get('Content-Type', 'Not set')}")
                
                if proxy_response.status_code == 200:
                    print("✅ Proxy URL working correctly!")
                else:
                    print(f"❌ Proxy URL failed: {proxy_response.text[:200]}")
            else:
                print("❌ No signed_url in response")
        else:
            print(f"❌ Request failed with status: {response.status_code}")
            print(f"Response text: {response.text[:500]}")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")

if __name__ == '__main__':
    test_frontend_endpoint()

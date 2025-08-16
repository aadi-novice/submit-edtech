#!/usr/bin/env python
import requests
import json
import time

def test_token_persistence():
    """Test if tokens work consistently across multiple requests"""
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
    
    # Test multiple endpoints with the same token
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    endpoints_to_test = [
        '/api/auth/me/',
        '/api/courses/my_courses/',
        '/api/courses/dashboard_stats/',
        '/api/lessonpdfs/1/view_pdf/'
    ]
    
    print("\n🧪 Testing multiple endpoints with the same token:")
    
    for endpoint in endpoints_to_test:
        url = f"{base_url}{endpoint}"
        print(f"\n📡 Testing: {endpoint}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ Success")
                # Don't print full response to keep it clean
                if 'json' in response.headers.get('Content-Type', ''):
                    data = response.json()
                    if isinstance(data, dict):
                        print(f"   Keys: {list(data.keys())[:5]}...")  # Show first 5 keys
                    elif isinstance(data, list):
                        print(f"   Array length: {len(data)}")
            else:
                print(f"   ❌ Error: {response.text[:100]}")
        
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {e}")
        
        # Small delay between requests
        time.sleep(0.5)

if __name__ == '__main__':
    test_token_persistence()

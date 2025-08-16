#!/usr/bin/env python3

import requests

# Get a fresh JWT token for student user
login_url = "http://localhost:8000/api/auth/login/"
login_data = {
    "username": "student",
    "password": "student123"
}

print("Getting fresh JWT token...")
response = requests.post(login_url, json=login_data)
if response.status_code == 200:
    data = response.json()
    access_token = data['access']
    print(f"✅ Got access token: {access_token[:50]}...")
    
    # Test the proxy PDF endpoint
    proxy_url = "http://localhost:8000/api/proxy-pdf/1"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print(f"\nTesting proxy endpoint: {proxy_url}")
    try:
        response = requests.get(proxy_url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        if response.status_code != 200:
            print(f"Response Text: {response.text}")
        else:
            print(f"✅ Proxy PDF endpoint working! Content length: {len(response.content)} bytes")
    except Exception as e:
        print(f"❌ Error: {e}")
        
else:
    print(f"❌ Login failed: {response.status_code} - {response.text}")

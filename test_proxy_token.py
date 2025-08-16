#!/usr/bin/env python

import requests
import json

def test_proxy_with_token_param():
    """Test proxy endpoint with token as query parameter"""
    base_url = "http://localhost:8000"
    
    # Login first
    print("🔐 Logging in...")
    login_data = {"username": "student", "password": "student123"}
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token = login_response.json().get('access')
    print(f"✅ Got token: {token[:20]}...")
    
    # Test proxy endpoint with token as query parameter
    proxy_url = f"{base_url}/api/proxy-pdf/1?token={token}"
    print(f"\n📄 Testing proxy with token param: {proxy_url[:70]}...")
    
    try:
        response = requests.get(proxy_url)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'Not set')}")
        print(f"Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            print("✅ Proxy with token parameter working!")
        else:
            print(f"❌ Failed: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_proxy_with_token_param()

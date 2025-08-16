#!/usr/bin/env python

import requests
import json

def test_auth_me_endpoint():
    """Test the /auth/me/ endpoint after login"""
    base_url = "http://localhost:8000"
    
    # First login
    print("🔐 Step 1: Login...")
    login_data = {"username": "student", "password": "student123"}
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    tokens = login_response.json()
    access_token = tokens['access']
    print(f"✅ Login successful, got token: {access_token[:30]}...")
    
    # Test /auth/me/ endpoint
    print("\n👤 Step 2: Testing /auth/me/ endpoint...")
    headers = {'Authorization': f'Bearer {access_token}'}
    me_response = requests.get(f"{base_url}/api/auth/me/", headers=headers)
    
    print(f"Status: {me_response.status_code}")
    print(f"Headers: {dict(me_response.headers)}")
    
    if me_response.status_code == 200:
        user_data = me_response.json()
        print(f"✅ User data received:")
        print(json.dumps(user_data, indent=2))
    else:
        print(f"❌ Failed: {me_response.text}")

if __name__ == '__main__':
    test_auth_me_endpoint()

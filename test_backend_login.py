#!/usr/bin/env python

import requests
import json

def test_backend_login():
    """Test the backend login endpoint directly"""
    url = "http://localhost:8000/api/auth/login/"
    
    print("🔍 Testing backend login endpoint directly...")
    print(f"URL: {url}")
    
    # Test with different credential combinations
    test_cases = [
        {"username": "student", "password": "student123"},
        {"username": "admin", "password": "admin123"},
        {"username": "student@example.com", "password": "student123"},  # If email is used
    ]
    
    for i, credentials in enumerate(test_cases, 1):
        print(f"\n📋 Test {i}: {credentials['username']} / {'*' * len(credentials['password'])}")
        
        try:
            response = requests.post(url, json=credentials, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS! Response keys: {list(data.keys())}")
                if 'access' in data:
                    print(f"Access token: {data['access'][:30]}...")
                if 'user' in data:
                    print(f"User data: {data['user']}")
            else:
                print(f"❌ FAILED! Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection refused - Django server not running?")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == '__main__':
    test_backend_login()

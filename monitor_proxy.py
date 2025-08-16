#!/usr/bin/env python3

import requests
import time

def test_proxy_endpoint():
    # Get fresh token
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {"username": "student", "password": "student123"}
    
    try:
        login_response = requests.get(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            return
            
        token = login_response.json()['access']
        
        # Test proxy endpoint
        proxy_url = "http://localhost:8000/api/proxy-pdf/1"
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(proxy_url, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ {time.strftime('%H:%M:%S')} - Proxy working (Content: {len(response.content)} bytes)")
        else:
            print(f"❌ {time.strftime('%H:%M:%S')} - Proxy failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {time.strftime('%H:%M:%S')} - Connection refused - Server might be down")
    except Exception as e:
        print(f"❌ {time.strftime('%H:%M:%S')} - Error: {e}")

if __name__ == "__main__":
    print("Monitoring proxy endpoint...")
    for i in range(5):
        test_proxy_endpoint()
        time.sleep(2)

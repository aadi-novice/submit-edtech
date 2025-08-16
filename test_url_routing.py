#!/usr/bin/env python3

import requests

# Test the proxy endpoint without authentication first to see if URL routing works
url = "http://localhost:8000/api/proxy-pdf/1"

print("Testing proxy endpoint routing (without auth)...")
try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 404:
        print("❌ URL pattern not found - 404 error")
        print(f"Response text: {response.text[:200]}...")
    elif response.status_code == 401 or response.status_code == 403:
        print("✅ URL pattern found but authentication failed (expected)")
    else:
        print(f"Response: {response.text[:200]}...")
except Exception as e:
    print(f"❌ Connection error: {e}")

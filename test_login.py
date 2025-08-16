#!/usr/bin/env python3

import requests

# Test the login endpoint
login_url = "http://localhost:8000/api/auth/login/"

# Try logging in with demo credentials
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("Testing login...")

try:
    response = requests.post(login_url, json=login_data)
    print(f"Login Status Code: {response.status_code}")
    print(f"Login Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get('access')
        print(f"Access token received: {access_token[:50]}...")
        
        # Test authenticated endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        test_response = requests.get("http://localhost:8000/api/courses/my_courses/", headers=headers)
        print(f"My courses Status: {test_response.status_code}")
        print(f"My courses Response: {test_response.text}")
        
except Exception as e:
    print(f"Error: {e}")

# Let's also try with email
print("\nTrying with student credentials...")
login_data_student = {
    "username": "student",
    "password": "student123"
}

try:
    response = requests.post(login_url, json=login_data_student)
    print(f"Student Login Status Code: {response.status_code}")
    print(f"Student Login Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

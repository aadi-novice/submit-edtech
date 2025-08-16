#!/usr/bin/env python3

import requests

# Test the proxy endpoint
url = "http://localhost:8000/api/proxy-pdf/1"
headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM0Njk5MDk4LCJpYXQiOjE3MzQ2MDI2OTgsImp0aSI6IjQ1MDJlMjFhN2Q3YzQ1ZWE5YjMzNjNkNzllYjY4OWI5IiwidXNlcl9pZCI6MX0.cHdUh3cQEGMwKcUy9eASMiHNebCc0uJJw_fLkYgDyXE"
}

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Content Length: {len(response.content)}")
    if response.status_code != 200:
        print(f"Response Text: {response.text}")
except Exception as e:
    print(f"Error: {e}")

#!/usr/bin/env python

import requests
import json

def test_pdf_loading_flow():
    """Test the complete PDF loading flow that the frontend uses"""
    base_url = "http://localhost:8000"
    
    # Step 1: Login
    print("🔐 Step 1: Logging in...")
    login_data = {"username": "student", "password": "student123"}
    login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    token = login_response.json().get('access')
    print(f"✅ Login successful, got token: {token[:20]}...")
    
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    
    # Step 2: Get enrolled courses
    print("\n📚 Step 2: Getting enrolled courses...")
    courses_response = requests.get(f"{base_url}/api/courses/my_courses/", headers=headers)
    print(f"Status: {courses_response.status_code}")
    
    if courses_response.status_code == 200:
        courses = courses_response.json()
        print(f"✅ Found {len(courses)} enrolled courses")
        if courses:
            course_id = courses[0]['id']
            print(f"Using course ID: {course_id}")
        else:
            print("❌ No enrolled courses found")
            return
    else:
        print(f"❌ Failed to get courses: {courses_response.text}")
        return
    
    # Step 3: Get lessons for the course
    print(f"\n📝 Step 3: Getting lessons for course {course_id}...")
    lessons_response = requests.get(f"{base_url}/api/lessons/?course={course_id}", headers=headers)
    print(f"Status: {lessons_response.status_code}")
    
    if lessons_response.status_code == 200:
        lessons = lessons_response.json()
        print(f"✅ Found {len(lessons)} lessons")
        if lessons:
            lesson_id = lessons[0]['id']
            print(f"Using lesson ID: {lesson_id}")
        else:
            print("❌ No lessons found")
            return
    else:
        print(f"❌ Failed to get lessons: {lessons_response.text}")
        return
    
    # Step 4: Get PDFs for the lesson
    print(f"\n📄 Step 4: Getting PDFs for lesson {lesson_id}...")
    pdfs_response = requests.get(f"{base_url}/api/lessonpdfs/?lesson={lesson_id}", headers=headers)
    print(f"Status: {pdfs_response.status_code}")
    
    if pdfs_response.status_code == 200:
        pdfs = pdfs_response.json()
        print(f"✅ Found {len(pdfs)} PDFs")
        if pdfs:
            pdf_id = pdfs[0]['id']
            print(f"Using PDF ID: {pdf_id}")
            print(f"PDF details: {pdfs[0]}")
        else:
            print("❌ No PDFs found")
            return
    else:
        print(f"❌ Failed to get PDFs: {pdfs_response.text}")
        return
    
    # Step 5: Get signed URL for PDF viewing
    print(f"\n🔗 Step 5: Getting signed URL for PDF {pdf_id}...")
    signed_url_response = requests.get(f"{base_url}/api/lessonpdfs/{pdf_id}/view_pdf/", headers=headers)
    print(f"Status: {signed_url_response.status_code}")
    
    if signed_url_response.status_code == 200:
        signed_url_data = signed_url_response.json()
        print(f"✅ Got signed URL data: {list(signed_url_data.keys())}")
        
        if 'signed_url' in signed_url_data:
            pdf_url = signed_url_data['signed_url']
            print(f"PDF URL: {pdf_url}")
            
            # Step 6: Test accessing the PDF URL
            print(f"\n📖 Step 6: Testing PDF access...")
            pdf_headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/pdf'}
            pdf_response = requests.get(pdf_url, headers=pdf_headers)
            print(f"PDF Status: {pdf_response.status_code}")
            print(f"PDF Content-Type: {pdf_response.headers.get('Content-Type', 'Not set')}")
            print(f"PDF Content-Length: {pdf_response.headers.get('Content-Length', 'Not set')}")
            
            if pdf_response.status_code == 200:
                print("✅ PDF accessible successfully!")
                print("🎉 Complete PDF loading flow working!")
            else:
                print(f"❌ PDF access failed: {pdf_response.text}")
        else:
            print("❌ No signed_url in response")
    else:
        print(f"❌ Failed to get signed URL: {signed_url_response.text}")

if __name__ == '__main__':
    test_pdf_loading_flow()

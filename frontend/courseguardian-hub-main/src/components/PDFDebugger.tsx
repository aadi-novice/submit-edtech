import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/services/api';
import Cookies from 'js-cookie';

export const PDFDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testPDFFlow = async () => {
    setTesting(true);
    const results: any = {};
    
    try {
      // Test token
      const token = Cookies.get('access_token');
      results.hasToken = !!token;
      results.tokenPreview = token ? token.substring(0, 20) + '...' : 'None';

      // Test getting courses
      console.log('Testing getMyCourses...');
      const courses = await authAPI.getMyCourses();
      results.courses = courses;
      
      if (courses && courses.length > 0) {
        const courseId = courses[0].id;
        results.selectedCourse = courseId;
        
        // Test getting lessons
        console.log('Testing getLessons...');
        const lessons = await authAPI.getLessons(courseId);
        results.lessons = lessons;
        
        if (lessons && lessons.length > 0) {
          const lessonId = lessons[0].id;
          results.selectedLesson = lessonId;
          
          // Test getting PDFs
          console.log('Testing getLessonPDFs...');
          const pdfs = await authAPI.getLessonPDFs(lessonId);
          results.pdfs = pdfs;
          
          if (pdfs && pdfs.length > 0) {
            const pdfId = pdfs[0].id;
            results.selectedPdf = pdfId;
            
            // Test getting signed URL
            console.log('Testing getPDFSignedUrl...');
            const signedUrlData = await authAPI.getPDFSignedUrl(pdfId);
            results.signedUrlData = signedUrlData;
            
            if (signedUrlData.signed_url) {
              // Test direct fetch of PDF
              console.log('Testing direct PDF fetch...');
              try {
                const response = await fetch(signedUrlData.signed_url, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf'
                  }
                });
                
                results.directFetch = {
                  status: response.status,
                  statusText: response.statusText,
                  contentType: response.headers.get('Content-Type'),
                  contentLength: response.headers.get('Content-Length'),
                  ok: response.ok
                };
                
                if (response.ok) {
                  const blob = await response.blob();
                  results.blobInfo = {
                    size: blob.size,
                    type: blob.type
                  };
                  
                  // Test blob URL creation
                  const blobUrl = URL.createObjectURL(blob);
                  results.blobUrl = blobUrl;
                  
                  // Test if we can create an iframe with the blob URL
                  results.canCreateBlobUrl = true;
                  
                  // Clean up
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                }
              } catch (fetchError: any) {
                results.directFetchError = fetchError.message;
              }
            }
          }
        }
      }
      
      setDebugInfo(results);
    } catch (error: any) {
      results.error = error.message;
      setDebugInfo(results);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>PDF Loading Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testPDFFlow} disabled={testing}>
            {testing ? 'Testing...' : 'Test PDF Loading Flow'}
          </Button>
          
          {Object.keys(debugInfo).length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};




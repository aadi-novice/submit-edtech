import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/services/api';

const DirectAPITester: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message); // Also log to browser console
  };

  const testDirectAPI = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('🚀 Starting direct API service tests...');

    try {
      addResult('🔐 Testing authAPI.login with student/student123...');
      const result = await authAPI.login('student', 'student123');
      addResult('✅ Login successful! Result structure:');
      addResult(`- Access token: ${result.access.substring(0, 20)}...`);
      addResult(`- Refresh token: ${result.refresh.substring(0, 20)}...`);
      addResult(`- User data: ${JSON.stringify({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role
      }, null, 2)}`);
      
      // Test additional API calls with the authenticated session
      try {
        addResult('👤 Testing getCurrentUser...');
        const currentUser = await authAPI.getCurrentUser();
        addResult(`✅ getCurrentUser successful: ${currentUser.username} (${currentUser.email})`);
      } catch (error) {
        addResult(`❌ getCurrentUser failed: ${error}`);
      }

      try {
        addResult('📚 Testing getCourses...');
        const courses = await authAPI.getCourses();
        addResult(`✅ getCourses successful: Found ${courses.length} courses`);
        if (courses.length > 0) {
          addResult(`First course: ${courses[0].title} (ID: ${courses[0].id})`);
        }
      } catch (error) {
        addResult(`❌ getCourses failed: ${error}`);
      }

    } catch (error) {
      addResult(`❌ Login failed: ${error}`);
      addResult('Full error object:');
      addResult(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }

    setTesting(false);
    addResult('🏁 Direct API tests completed!');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Direct API Service Tester</CardTitle>
        <CardDescription>
          Test the API service directly without UI components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDirectAPI} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running API Tests...' : 'Test Direct API Service'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">API Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1 whitespace-pre-wrap">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DirectAPITester;

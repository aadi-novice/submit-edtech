import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NetworkTester: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnectivity = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('Starting connectivity tests...');

    // Test 1: Basic fetch to backend
    try {
      addResult('Test 1: Testing basic fetch to backend root...');
      const response = await fetch('http://localhost:8000/', {
        method: 'GET',
        mode: 'cors'
      });
      addResult(`✅ Backend root response: ${response.status} ${response.statusText}`);
    } catch (error) {
      addResult(`❌ Backend root failed: ${error}`);
    }

    // Test 2: API endpoint health check
    try {
      addResult('Test 2: Testing API endpoint...');
      const response = await fetch('http://localhost:8000/api/', {
        method: 'GET',
        mode: 'cors'
      });
      addResult(`✅ API endpoint response: ${response.status} ${response.statusText}`);
    } catch (error) {
      addResult(`❌ API endpoint failed: ${error}`);
    }

    // Test 3: Login endpoint with OPTIONS (CORS preflight)
    try {
      addResult('Test 3: Testing CORS preflight for login...');
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'OPTIONS',
        mode: 'cors'
      });
      addResult(`✅ CORS preflight response: ${response.status} ${response.statusText}`);
      
      // Log CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      };
      addResult(`CORS headers: ${JSON.stringify(corsHeaders, null, 2)}`);
    } catch (error) {
      addResult(`❌ CORS preflight failed: ${error}`);
    }

    // Test 4: Direct login test
    try {
      addResult('Test 4: Testing direct login...');
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'student',
          password: 'student123'
        })
      });
      
      const responseText = await response.text();
      addResult(`Login response status: ${response.status} ${response.statusText}`);
      addResult(`Login response body: ${responseText}`);
      
      if (response.ok) {
        addResult('✅ Direct login successful!');
      } else {
        addResult('❌ Direct login failed');
      }
    } catch (error) {
      addResult(`❌ Direct login error: ${error}`);
    }

    // Test 5: Check current API base URL from environment
    addResult(`Environment API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL}`);
    
    setTesting(false);
    addResult('Tests completed!');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Network Connectivity Tester</CardTitle>
        <CardDescription>
          Test frontend-to-backend connectivity and CORS configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnectivity} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Running Tests...' : 'Run Connectivity Tests'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Test Results:</h3>
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

export default NetworkTester;

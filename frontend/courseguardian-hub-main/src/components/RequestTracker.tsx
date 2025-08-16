import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RequestTracker: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student123');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[RequestTracker] ${message}`);
  };

  const testRawFetch = async () => {
    addLog('🚀 Starting raw fetch test...');
    
    try {
      addLog('📍 Testing basic connectivity to backend...');
      
      // Test 1: Basic connection
      const apiUrl = 'http://localhost:8000/api/';
      addLog(`🔗 Testing: ${apiUrl}`);
      
      const response1 = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      addLog(`✅ Basic API response: ${response1.status} ${response1.statusText}`);
      const text1 = await response1.text();
      addLog(`📄 Response body: ${text1}`);
      
      // Test 2: Login endpoint
      const loginUrl = 'http://localhost:8000/api/auth/login/';
      addLog(`🔗 Testing login: ${loginUrl}`);
      
      const loginData = {
        username: username,
        password: password
      };
      
      addLog(`📤 Sending login data: ${JSON.stringify({ ...loginData, password: '***' })}`);
      
      const response2 = await fetch(loginUrl, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      addLog(`📥 Login response status: ${response2.status} ${response2.statusText}`);
      
      // Log all response headers
      const headers: string[] = [];
      response2.headers.forEach((value, key) => {
        headers.push(`${key}: ${value}`);
      });
      addLog(`📋 Response headers:\n${headers.join('\n')}`);
      
      const text2 = await response2.text();
      addLog(`📄 Login response body: ${text2}`);
      
      if (response2.ok) {
        addLog('✅ Raw fetch login successful!');
        try {
          const data = JSON.parse(text2);
          addLog(`🎟️ Received tokens: access=${data.access?.substring(0, 20)}..., refresh=${data.refresh?.substring(0, 20)}...`);
        } catch (e) {
          addLog('⚠️ Could not parse response as JSON');
        }
      } else {
        addLog('❌ Raw fetch login failed');
      }
      
    } catch (error) {
      addLog(`💥 Fetch error: ${error}`);
      addLog(`📊 Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    }
  };

  const testAxiosAPI = async () => {
    addLog('🚀 Starting axios API test...');
    
    try {
      // Import the API service dynamically to get fresh instance
      const { authAPI } = await import('@/services/api');
      
      addLog('📤 Calling authAPI.login...');
      const result = await authAPI.login(username, password);
      
      addLog('✅ Axios API login successful!');
      addLog(`👤 User data: ${JSON.stringify({
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role
      }, null, 2)}`);
      
    } catch (error) {
      addLog(`💥 Axios API error: ${error}`);
      addLog(`📊 Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Request Tracker & Network Debugger</CardTitle>
        <CardDescription>
          Track and debug frontend-to-backend requests step by step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testRawFetch}>Test Raw Fetch</Button>
          <Button onClick={testAxiosAPI} variant="outline">Test Axios API</Button>
          <Button onClick={clearLogs} variant="secondary">Clear Logs</Button>
        </div>
        
        {logs.length > 0 && (
          <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            <h3 className="text-white font-semibold mb-2">Request Logs:</h3>
            {logs.map((log, index) => (
              <div key={index} className="mb-1 whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestTracker;

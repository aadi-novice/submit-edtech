import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginTester: React.FC = () => {
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('student123');
  const [result, setResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testLogin = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      // Test direct fetch to backend
      console.log('🔄 Testing direct fetch to backend...');
      const loginUrl = 'http://localhost:8000/api/auth/login/';
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      console.log('📥 Response received:', response.status, response.statusText);
      
      const data = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      });
      
    } catch (error: any) {
      console.error('❌ Login test error:', error);
      setResult({
        success: false,
        error: error.message,
        stack: error.stack
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Login Connectivity Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button onClick={testLogin} disabled={testing} className="w-full">
            {testing ? 'Testing...' : 'Test Login'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

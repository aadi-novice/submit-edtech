import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Cookies from 'js-cookie';

const CookieManager: React.FC = () => {
  const [cookies, setCookies] = useState<string>('');

  const showCookies = () => {
    const accessToken = Cookies.get('access_token');
    const refreshToken = Cookies.get('refresh_token');
    
    const cookieInfo = {
      access_token: accessToken ? accessToken.substring(0, 20) + '...' : 'Not found',
      refresh_token: refreshToken ? refreshToken.substring(0, 20) + '...' : 'Not found',
      all_cookies: document.cookie
    };
    
    setCookies(JSON.stringify(cookieInfo, null, 2));
  };

  const clearCookies = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    
    // Also try to remove with different path options
    Cookies.remove('access_token', { path: '/' });
    Cookies.remove('refresh_token', { path: '/' });
    
    setCookies('Cookies cleared!');
    
    // Show updated state
    setTimeout(showCookies, 100);
  };

  const testCookieSet = () => {
    Cookies.set('test_cookie', 'test_value', { expires: 1 });
    setCookies('Test cookie set!');
    setTimeout(showCookies, 100);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Cookie Manager</CardTitle>
        <CardDescription>
          Manage authentication cookies for debugging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={showCookies}>Show Cookies</Button>
          <Button onClick={clearCookies} variant="outline">Clear Auth Cookies</Button>
          <Button onClick={testCookieSet} variant="secondary">Test Cookie Set</Button>
        </div>
        
        {cookies && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cookie Information:</h3>
            <pre className="text-sm whitespace-pre-wrap">{cookies}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CookieManager;

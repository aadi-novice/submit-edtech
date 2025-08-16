import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/services/api';

export const DebugAuth: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    const checkAuth = async () => {
      // Check cookies
      const accessToken = Cookies.get('access_token');
      const refreshToken = Cookies.get('refresh_token');
      
      const info = {
        accessToken: accessToken ? accessToken.substring(0, 20) + '...' : 'None',
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : 'None',
        allCookies: document.cookie,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
      
      // Test API endpoints
      const results: any = {};
      
      try {
        console.log('🧪 Testing /auth/me/');
        const meResult = await authAPI.getCurrentUser();
        results.authMe = { status: 'success', data: meResult };
      } catch (error: any) {
        results.authMe = { status: 'error', error: error.message };
      }
      
      try {
        console.log('🧪 Testing /courses/my_courses/');
        const coursesResult = await authAPI.getMyCourses();
        results.myCourses = { status: 'success', count: coursesResult.length };
      } catch (error: any) {
        results.myCourses = { status: 'error', error: error.message };
      }
      
      try {
        console.log('🧪 Testing /courses/dashboard_stats/');
        const dashboardResult = await authAPI.getDashboardStats();
        results.dashboard = { status: 'success', data: dashboardResult };
      } catch (error: any) {
        results.dashboard = { status: 'error', error: error.message };
      }
      
      setTestResults(results);
    };
    
    checkAuth();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Cookie Information</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Access Token:</strong> {debugInfo.accessToken}</div>
            <div><strong>Refresh Token:</strong> {debugInfo.refreshToken}</div>
            <div><strong>All Cookies:</strong> <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{debugInfo.allCookies}</pre></div>
            <div><strong>Timestamp:</strong> {debugInfo.timestamp}</div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">API Test Results</h2>
          <div className="space-y-3 text-sm">
            {Object.entries(testResults).map(([endpoint, result]: [string, any]) => (
              <div key={endpoint} className="border-l-4 border-blue-500 pl-3">
                <div className="font-medium">{endpoint}</div>
                <div className={`${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {result.status}
                </div>
                {result.error && (
                  <div className="text-red-500 text-xs mt-1">Error: {result.error}</div>
                )}
                {result.data && (
                  <div className="text-green-600 text-xs mt-1">
                    Data: {JSON.stringify(result.data, null, 2).substring(0, 100)}...
                  </div>
                )}
                {result.count !== undefined && (
                  <div className="text-green-600 text-xs mt-1">Count: {result.count}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800">Instructions:</h3>
        <p className="text-yellow-700 text-sm mt-1">
          1. Login first, then navigate to this debug page<br/>
          2. Check if cookies are set correctly<br/>
          3. See which API endpoints are failing<br/>
          4. Open browser dev tools to see network requests
        </p>
      </div>
    </div>
  );
};

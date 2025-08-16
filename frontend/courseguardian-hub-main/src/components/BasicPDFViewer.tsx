import React, { useEffect, useRef } from 'react';

interface BasicPDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
}

export const BasicPDFViewer: React.FC<BasicPDFViewerProps> = ({
  pdfUrl,
  title,
  className = ""
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  console.log('🎯 BasicPDFViewer rendering with URL:', pdfUrl);

  useEffect(() => {
    console.log('🔄 Setting up iframe for URL:', pdfUrl);
    
    // Test the URL with fetch first to see what happens
    fetch(pdfUrl, {
      credentials: 'include' // This ensures cookies are sent
    })
    .then(response => {
      console.log('✅ Fetch test successful:', response.status, response.statusText);
      console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
      return response.blob();
    })
    .then(blob => {
      console.log('📁 PDF blob size:', blob.size, 'bytes');
    })
    .catch(error => {
      console.error('❌ Fetch test failed:', error);
    });
  }, [pdfUrl]);

  // Let's test the URL directly first
  const testUrl = () => {
    console.log('🧪 Testing URL:', pdfUrl);
    window.open(pdfUrl, '_blank');
  };

  const testDebugEndpoint = () => {
    // Get token from cookies for debug test
    const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
    const debugUrl = `http://localhost:8000/api/debug-token/?token=${token}`;
    console.log('🔍 Testing debug endpoint:', debugUrl);
    window.open(debugUrl, '_blank');
  };

  const testServerConnectivity = () => {
    const testUrl = `http://localhost:8000/api/test/`;
    console.log('🔌 Testing basic server connectivity:', testUrl);
    fetch(testUrl)
      .then(response => response.text())
      .then(text => {
        console.log('✅ Server connectivity test successful:', text);
        alert('Server is reachable: ' + text);
      })
      .catch(error => {
        console.error('❌ Server connectivity test failed:', error);
        alert('Server connectivity failed: ' + error.message);
      });
  };

  const testProxyRouting = () => {
    const testUrl = `http://localhost:8000/api/test-proxy/1`;
    console.log('🛣️ Testing proxy URL routing:', testUrl);
    fetch(testUrl)
      .then(response => response.text())
      .then(text => {
        console.log('✅ Proxy routing test successful:', text);
        alert('Proxy routing works: ' + text);
      })
      .catch(error => {
        console.error('❌ Proxy routing test failed:', error);
        alert('Proxy routing failed: ' + error.message);
      });
  };

  const handleIframeLoad = () => {
    console.log('✅ Iframe loaded successfully!');
  };

  const handleIframeError = (error: any) => {
    console.error('❌ Iframe error:', error);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex gap-1 flex-wrap">
          <button 
            onClick={testServerConnectivity}
            className="px-1 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            🔌 Server
          </button>
          <button 
            onClick={testProxyRouting}
            className="px-1 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            🛣️ Routing
          </button>
          <button 
            onClick={testDebugEndpoint}
            className="px-1 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            🔍 Token
          </button>
          <button 
            onClick={testUrl}
            className="px-1 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🧪 PDF
          </button>
        </div>
      </div>
      
      <div className="w-full h-96">
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          className="w-full h-full border-0"
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
};

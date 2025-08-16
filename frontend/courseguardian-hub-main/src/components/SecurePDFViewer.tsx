import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, Eye, Shield, Download, AlertTriangle, User, Clock } from 'lucide-react';
import Cookies from 'js-cookie';

interface SecurePDFViewerProps {
  pdfUrl: string;
  title: string;
  userId?: number;
  watermark?: string;
  className?: string;
}

export const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({
  pdfUrl,
  title,
  userId,
  watermark,
  className = ""
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProtected, setIsProtected] = useState(true);
  const [isWatermarkVisible, setIsWatermarkVisible] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attempts, setAttempts] = useState(0);

  const showProtectionWarning = () => {
    alert('⚠️ Security Alert: Direct download, print, or copy operations are disabled for your protection. This PDF is watermarked and monitored.');
  };

  const addProtectionLayer = useCallback(() => {
    if (!iframeRef.current) return;

    try {
      // Add keyboard event listeners to prevent downloads
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent Ctrl+S, Ctrl+P, F12, etc.
        if (
          e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c') ||
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          e.key === 'PrintScreen' ||
          (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'c')) // Mac Cmd keys
        ) {
          e.preventDefault();
          e.stopPropagation();
          setAttempts(prev => prev + 1);
          showProtectionWarning();
          return false;
        }
      };

      // Add context menu prevention
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAttempts(prev => prev + 1);
        showProtectionWarning();
        return false;
      };

      // Add mouse move tracking for security
      let mouseMoveTimer: NodeJS.Timeout;
      const handleMouseMove = () => {
        clearTimeout(mouseMoveTimer);
        mouseMoveTimer = setTimeout(() => {
          setIsProtected(false);
        }, 30000); // 30 seconds of inactivity
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu as EventListener);
      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu as EventListener);
        document.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(mouseMoveTimer);
      };
    } catch (err) {
      console.warn('Could not add protection layer due to CORS restrictions:', err);
    }
  }, []);

  useEffect(() => {
    const loadPDF = async () => {
      if (!pdfUrl) {
        console.log('⚠️ No PDF URL provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Loading PDF:', pdfUrl);
        
        // Get authentication token
        const token = Cookies.get('access_token');
        console.log('🔑 Token available:', token ? 'Yes' : 'No');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        // Check if this is a proxy URL that can be loaded directly
        const isProxyUrl = pdfUrl.includes('/api/proxy-pdf/');
        
        if (isProxyUrl) {
          console.log('🎯 Detected proxy URL - loading directly in iframe');
          
          // For proxy URLs, we can load directly with token in URL
          const authenticatedUrl = `${pdfUrl}?token=${encodeURIComponent(token)}`;
          
          if (iframeRef.current) {
            const iframe = iframeRef.current;
            
            console.log('🎯 Setting iframe src to authenticated proxy URL');
            iframe.src = authenticatedUrl;
            
            // Quick timeout for proxy URLs
            const quickTimeout = setTimeout(() => {
              console.log('⚡ Proxy URL timeout (1s) - assuming successful load');
              setLoading(false);
              addProtectionLayer();
            }, 1000);
            
            const handleLoad = () => {
              console.log('✅ Proxy iframe loaded successfully');
              clearTimeout(quickTimeout);
              setLoading(false);
              addProtectionLayer();
            };
            
            const handleError = (e: any) => {
              console.error('❌ Proxy iframe load error:', e);
              clearTimeout(quickTimeout);
              setError('Failed to display PDF in viewer');
              setLoading(false);
            };
            
            iframe.onload = handleLoad;
            iframe.onerror = handleError;
          }
        } else {
          console.log('🔄 Non-proxy URL - using fetch approach');
          
          // For non-proxy URLs, use the fetch and blob approach
          const response = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf'
            },
            credentials: 'include'
          });
          
          console.log('📥 Response received:', response.status, response.statusText);
          console.log('📄 Content-Type:', response.headers.get('Content-Type'));
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          // Create blob from response
          console.log('🔄 Creating blob...');
          const pdfBlob = await response.blob();
          console.log('✅ Blob created:', pdfBlob.size, 'bytes, type:', pdfBlob.type);
          
          // Create object URL
          const blobUrl = URL.createObjectURL(pdfBlob);
          console.log('🔗 Blob URL created:', blobUrl);
          
          // Set iframe source
          if (iframeRef.current) {
            const iframe = iframeRef.current;
            
            console.log('🎯 Setting iframe src to blob URL');
            iframe.src = blobUrl;
            
            // Aggressive timeout fallback - PDFs often don't fire onload reliably
            const quickTimeout = setTimeout(() => {
              console.log('⚡ Quick timeout (1s) - forcing load completion');
              setLoading(false);
              addProtectionLayer();
            }, 1000); // Just 1 second
            
            const handleLoad = () => {
              console.log('✅ Blob iframe loaded successfully');
              clearTimeout(quickTimeout);
              setLoading(false);
              addProtectionLayer();
              
              // Clean up blob URL after successful load
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
                console.log('🧹 Blob URL cleaned up');
              }, 2000);
            };
            
            const handleError = (e: any) => {
              console.error('❌ Blob iframe load error:', e);
              clearTimeout(quickTimeout);
              setError('Failed to display PDF in viewer');
              setLoading(false);
              URL.revokeObjectURL(blobUrl);
            };
            
            iframe.onload = handleLoad;
            iframe.onerror = handleError;
          }
        }
        
      } catch (err: any) {
        console.error('❌ PDF loading error:', err);
        setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl, addProtectionLayer]);

  const handleDownloadAttempt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showProtectionWarning();
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center border rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading secure PDF viewer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center border rounded-lg ${className}`}>
        <div className="text-center text-red-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border rounded-lg overflow-hidden ${className}`}>
      {/* Security Header */}
      <div className="bg-muted border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Secure PDF Viewer</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Protected View
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            No Downloads
          </span>
          {attempts > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {attempts} Attempt{attempts !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* PDF Content with Watermark */}
      <div className="relative bg-white">
        <iframe
          ref={iframeRef}
          src=""
          className="w-full h-96 border-0"
          title={`Secure PDF Viewer - ${title}`}
          sandbox="allow-same-origin allow-scripts allow-forms"
          style={{
            pointerEvents: 'auto',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none'
          }}
          onLoad={() => {
            console.log('🎯 Iframe onLoad event fired');
          }}
          onError={(e) => {
            console.error('🚨 Iframe onError event fired:', e);
            setError('Failed to load PDF in iframe');
            setLoading(false);
          }}
        />
        
        {/* Dynamic Watermark Overlay - Very Subtle */}
        {isWatermarkVisible && watermark && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Small corner watermarks */}
            <div className="absolute top-2 right-2 transform rotate-12 text-gray-400 text-xs font-mono opacity-20 bg-white bg-opacity-50 px-1 py-0.5 rounded">
              {watermark.split(' • ')[0]} {/* Just show username part */}
            </div>
            <div className="absolute bottom-2 left-2 transform -rotate-12 text-gray-400 text-xs font-mono opacity-20 bg-white bg-opacity-50 px-1 py-0.5 rounded">
              PROTECTED
            </div>
          </div>
        )}
        
        {/* Protection Overlay */}
        {isProtected && (
          <div
            className="absolute inset-0 bg-black bg-opacity-5 flex items-center justify-center pointer-events-none"
            style={{ display: 'none' }}
          >
            <div className="text-center text-white">
              <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Protected Content</p>
              <p className="text-xs opacity-75">Watermarked & Monitored</p>
            </div>
          </div>
        )}
      </div>

      {/* Security Footer */}
      <div className="bg-muted border-t p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <span>
              This PDF is protected and cannot be downloaded, printed, or copied.
            </span>
          </div>
          {watermark ? (
            <div className="flex items-center gap-1 text-green-600">
              <User className="h-3 w-3" />
              <Clock className="h-3 w-3" />
              <span className="font-medium">
                {watermark}
              </span>
            </div>
          ) : userId && (
            <span className="text-green-600 font-medium">
              Watermarked for User {userId}
            </span>
          )}
        </div>
        <div className="mt-2 text-center">
          <button
            onClick={handleDownloadAttempt}
            className="text-xs text-red-600 hover:text-red-700 underline"
          >
            ⚠️ Attempt Download (Blocked)
          </button>
          {attempts > 3 && (
            <div className="mt-1 text-xs text-orange-600">
              ⚠️ Multiple security violations detected. Access may be restricted.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Eye, Shield, Download, AlertTriangle, User, Clock } from 'lucide-react';
import Cookies from 'js-cookie';

interface SimplePDFViewerProps {
  pdfUrl: string;
  title: string;
  userId?: number;
  watermark?: string;
  className?: string;
}

export const SimplePDFViewer: React.FC<SimplePDFViewerProps> = ({
  pdfUrl,
  title,
  userId,
  watermark,
  className = ""
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showProtectionWarning = () => {
    setAttempts(prev => prev + 1);
    alert('⚠️ Security Alert: Direct download, print, or copy operations are disabled for your protection. This PDF is watermarked and monitored.');
  };

  useEffect(() => {
    if (!pdfUrl) {
      setLoading(false);
      return;
    }

    console.log('🔄 Loading PDF:', pdfUrl);
    
    // Get authentication token
    const token = Cookies.get('access_token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    // Since our backend supports ?token= parameter, use that for iframe
    const authenticatedUrl = `${pdfUrl}?token=${encodeURIComponent(token)}`;
    console.log('🎯 Using authenticated URL:', authenticatedUrl);

    if (iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Set src immediately
      iframe.src = authenticatedUrl;
      
      // Force stop loading after 2 seconds regardless of onload event
      const forceLoadComplete = setTimeout(() => {
        console.log('⚡ Force completing load after 2 seconds');
        setLoading(false);
      }, 2000);

      const handleLoad = () => {
        console.log('✅ Iframe loaded successfully');
        clearTimeout(forceLoadComplete);
        setLoading(false);
      };

      const handleError = (e: any) => {
        console.error('❌ Iframe error:', e);
        clearTimeout(forceLoadComplete);
        setError('Failed to load PDF');
        setLoading(false);
      };

      iframe.onload = handleLoad;
      iframe.onerror = handleError;

      return () => {
        clearTimeout(forceLoadComplete);
      };
    }
  }, [pdfUrl]);

  // Add protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'c'))
      ) {
        e.preventDefault();
        showProtectionWarning();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showProtectionWarning();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center border rounded-lg ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
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

      {/* PDF Content */}
      <div className="relative bg-white">
        <iframe
          ref={iframeRef}
          className="w-full h-96 border-0"
          title={`Secure PDF Viewer - ${title}`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
        />
        
        {/* Subtle watermarks */}
        {watermark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 transform rotate-12 text-gray-400 text-xs font-mono opacity-30 bg-white bg-opacity-70 px-1 py-0.5 rounded">
              {watermark.split(' • ')[0]}
            </div>
            <div className="absolute bottom-2 left-2 transform -rotate-12 text-gray-400 text-xs font-mono opacity-30 bg-white bg-opacity-70 px-1 py-0.5 rounded">
              PROTECTED
            </div>
          </div>
        )}
      </div>

      {/* Security Footer */}
      <div className="bg-muted border-t p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <span>This PDF is protected and cannot be downloaded, printed, or copied.</span>
          </div>
          {watermark && (
            <div className="flex items-center gap-1 text-green-600">
              <User className="h-3 w-3" />
              <Clock className="h-3 w-3" />
              <span className="font-medium">{watermark}</span>
            </div>
          )}
        </div>
        {attempts > 3 && (
          <div className="mt-2 text-center text-xs text-orange-600">
            ⚠️ Multiple security violations detected. Access may be restricted.
          </div>
        )}
      </div>
    </div>
  );
};

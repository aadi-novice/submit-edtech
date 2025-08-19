import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield, Eye, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlobPDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
  userId?: number;
  watermark?: string;
}

export const BlobPDFViewer: React.FC<BlobPDFViewerProps> = ({
  pdfUrl,
  title,
  className = "",
  userId,
  watermark
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(null);

  console.log('🎯 Secure BlobPDFViewer rendering with URL:', pdfUrl);

  const showProtectionWarning = () => {
    setAttempts(prev => prev + 1);
    alert('🚫 SECURITY VIOLATION: This document is protected. All access attempts are logged and monitored.');
  };

  // Enhanced security protection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow arrow keys and page navigation keys for PDF
      const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'Space'];
      
      if (allowedKeys.includes(e.key)) {
        // Allow these keys to pass through to the PDF
        return;
      }

      // Block all other shortcuts
      if (
        e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'z' || e.key === 'y') ||
        e.key === 'F12' || e.key === 'F5' || e.key === 'F3' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J' || e.key === 'K')) ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'c' || e.key === 'v' || e.key === 'x')) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showProtectionWarning();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showProtectionWarning();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      // Only prevent selection outside the PDF iframe
      const target = e.target as HTMLElement;
      if (!target.closest('iframe')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showProtectionWarning();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showProtectionWarning();
      return false;
    };

    // Add all event listeners with capture
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
    document.addEventListener('selectstart', handleSelectStart, { capture: true, passive: false });
    document.addEventListener('dragstart', handleDragStart, { capture: true, passive: false });
    document.addEventListener('copy', handleCopy, { capture: true, passive: false });
    document.addEventListener('cut', handleCopy, { capture: true, passive: false });
    document.addEventListener('paste', handleCopy, { capture: true, passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('cut', handleCopy, { capture: true });
      document.removeEventListener('paste', handleCopy, { capture: true });
    };
  }, []);

  // Add CSS to disable text selection but allow PDF interaction
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .secure-pdf-viewer {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      /* PDF Container - Allow interaction */
      .pdf-iframe-container {
        position: relative;
        overflow: hidden;
      }
      
      .pdf-iframe-container iframe {
        width: 100% !important;
        height: 100% !important;
        border: none;
        /* Allow all interactions on the PDF itself */
        pointer-events: auto !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      /* Disable print styles */
      @media print {
        .secure-pdf-viewer {
          display: none !important;
        }
        body * {
          visibility: hidden !important;
        }
        body::before {
          content: "PRINTING IS DISABLED FOR SECURITY REASONS" !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          font-size: 24px !important;
          color: red !important;
          visibility: visible !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching secure PDF as blob from:', pdfUrl);
        
        const response = await fetch(pdfUrl, {
          credentials: 'include',
          headers: {
            'Accept': 'application/pdf',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('✅ Secure PDF blob received, size:', blob.size, 'bytes');
        
        // Create object URL from blob
        objectUrl = URL.createObjectURL(blob);
        console.log('🔗 Created secure blob URL:', objectUrl);
        
        setBlobUrl(objectUrl);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Failed to load secure PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPDF();

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        console.log('🗑️ Revoked secure blob URL');
      }
    };
  }, [pdfUrl]);

  // Navigation helper functions
  const navigatePrevious = () => {
    // Focus the iframe and simulate key press
    if (iframeRef) {
      iframeRef.focus();
      // Dispatch keyboard event to the document
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        code: 'ArrowLeft',
        keyCode: 37,
        which: 37,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  const navigateNext = () => {
    // Focus the iframe and simulate key press
    if (iframeRef) {
      iframeRef.focus();
      // Dispatch keyboard event to the document
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        code: 'ArrowRight',
        keyCode: 39,
        which: 39,
        bubbles: true
      });
      document.dispatchEvent(event);
    }
  };

  if (loading) {
    return (
      <div className={`border rounded-lg overflow-hidden secure-pdf-viewer ${className}`}>
        <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Loading Secure PDF...</span>
          </div>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Initializing navigation-enabled security mode...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-lg overflow-hidden secure-pdf-viewer ${className}`}>
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-700">Security Error</span>
          </div>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load secure PDF</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden secure-pdf-viewer ${className}`}>
      {/* Enhanced Security Header */}
      <div className="bg-green-50 border-b border-green-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">SECURE NAVIGATION MODE</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-green-600">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              SCROLLING ENABLED
            </span>
            <span>📜 ← → NAVIGATION</span>
            <span>🔍 ZOOM OK</span>
            <span>🚫 NO DOWNLOAD</span>
            {attempts > 0 && (
              <span className="flex items-center gap-1 text-red-800 font-bold">
                <AlertTriangle className="h-3 w-3" />
                {attempts} VIOLATION{attempts !== 1 ? 'S' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="mt-1">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
          <p className="text-xs text-gray-600">📜 Full PDF navigation enabled - Use scroll, arrow keys, or navigation buttons</p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center justify-center gap-4">
        <button
          onClick={navigatePrevious}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Page
        </button>
        <div className="text-xs text-gray-600 px-4">
          Use ← → arrow keys or scroll to navigate
        </div>
        <button
          onClick={navigateNext}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Next Page
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* PDF Content */}
      <div className="relative w-full h-96 pdf-iframe-container">
        {blobUrl && (
          <>
            <iframe
              ref={setIframeRef}
              src={blobUrl}
              className="w-full h-full border-0"
              title={title}
              onLoad={() => console.log('✅ Secure blob iframe loaded successfully with navigation enabled')}
              onError={(e) => console.error('❌ Secure blob iframe error:', e)}
              style={{
                userSelect: 'none'
              }}
            />
            
            {/* Minimal watermark overlays that don't interfere with interaction */}
            <div className="absolute inset-0 pointer-events-none select-none z-10">
              {/* Corner watermarks */}
              <div className="absolute top-2 right-2 transform rotate-12 text-red-500 text-xs font-bold opacity-20 bg-white bg-opacity-50 px-2 py-1 rounded shadow">
                🔒 PROTECTED
              </div>
              <div className="absolute bottom-2 left-2 transform -rotate-12 text-red-500 text-xs font-bold opacity-20 bg-white bg-opacity-50 px-2 py-1 rounded shadow">
                🚫 NO DOWNLOAD
              </div>
              
              {/* User/timestamp watermark */}
              {watermark && (
                <>
                  <div className="absolute top-2 left-2 text-gray-500 text-xs font-mono opacity-30 bg-white bg-opacity-50 px-1 py-0.5 rounded">
                    {watermark}
                  </div>
                  <div className="absolute bottom-2 right-2 text-gray-500 text-xs font-mono opacity-30 bg-white bg-opacity-50 px-1 py-0.5 rounded">
                    MONITORED ACCESS
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Enhanced Security Footer */}
      <div className="bg-green-50 border-t border-green-200 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <Eye className="h-3 w-3" />
            <span>📜 NAVIGATION ENABLED: Scrolling, arrow keys, and zoom controls available</span>
          </div>
          {watermark ? (
            <div className="flex items-center gap-1 text-green-700">
              <User className="h-3 w-3" />
              <Clock className="h-3 w-3" />
              <span className="font-bold">{watermark}</span>
            </div>
          ) : userId && (
            <span className="text-green-700 font-bold">🔍 Tracked: User {userId}</span>
          )}
        </div>
        
        {attempts > 0 && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
            <div className="text-center text-xs text-red-800 font-bold">
              🚨 SECURITY ALERT: {attempts} violation{attempts !== 1 ? 's' : ''} detected
            </div>
            {attempts > 3 && (
              <div className="mt-1 text-xs text-red-900 font-bold text-center">
                ⚠️ EXCESSIVE VIOLATIONS: Access session may be terminated
              </div>
            )}
          </div>
        )}
        
        <div className="mt-2 text-center text-xs text-gray-600">
          <span className="bg-gray-100 px-2 py-1 rounded">
            🔐 Protected Document - Navigation enabled, download blocked - Unauthorized access attempts are logged
          </span>
        </div>
      </div>
    </div>
  );
};
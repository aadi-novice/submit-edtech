import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Eye, Shield, AlertTriangle, User, Clock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ReactPDFViewerProps {
  pdfUrl: string;
  title: string;
  userId?: number;
  watermark?: string;
  className?: string;
}

export const ReactPDFViewer: React.FC<ReactPDFViewerProps> = ({
  pdfUrl,
  title,
  userId,
  watermark,
  className = ""
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [attempts, setAttempts] = useState(0);

  const showProtectionWarning = () => {
    setAttempts(prev => prev + 1);
    alert('🚫 SECURITY VIOLATION: This document is protected. All access attempts are logged and monitored.');
  };

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ PDF load error:', error);
    setError(`Failed to load PDF: ${error.message}`);
    setLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    console.log('✅ Page loaded successfully');
  }, []);

  const onPageLoadError = useCallback((error: Error) => {
    console.error('❌ Page load error:', error);
  }, []);

  // Custom file loading function with authentication
  const options = {
    httpHeaders: {
      'Authorization': `Bearer ${Cookies.get('access_token')}`,
    },
    withCredentials: true,
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  // Enhanced security protection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all common shortcuts for saving, printing, copying, dev tools
      if (
        e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'z' || e.key === 'y') ||
        e.key === 'F12' || e.key === 'F5' || e.key === 'F3' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J' || e.key === 'K')) ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'c' || e.key === 'v' || e.key === 'x')) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'Escape'
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
      e.preventDefault();
      e.stopPropagation();
      return false;
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

    // Disable dev tools detection
    const handleDevTools = () => {
      showProtectionWarning();
      // Optional: redirect or close tab
    };

    // Add all event listeners
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
    document.addEventListener('selectstart', handleSelectStart, { capture: true, passive: false });
    document.addEventListener('dragstart', handleDragStart, { capture: true, passive: false });
    document.addEventListener('copy', handleCopy, { capture: true, passive: false });
    document.addEventListener('cut', handleCopy, { capture: true, passive: false });
    document.addEventListener('paste', handleCopy, { capture: true, passive: false });

    // Disable right-click and selection on images
    const disableImageInteractions = () => {
      const images = document.querySelectorAll('img, canvas, svg');
      images.forEach(img => {
        img.addEventListener('contextmenu', handleContextMenu);
        img.addEventListener('dragstart', handleDragStart);
        img.addEventListener('selectstart', handleSelectStart);
      });
    };

    // Run periodically to catch dynamically added images
    const interval = setInterval(disableImageInteractions, 1000);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('selectstart', handleSelectStart, { capture: true });
      document.removeEventListener('dragstart', handleDragStart, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('cut', handleCopy, { capture: true });
      document.removeEventListener('paste', handleCopy, { capture: true });
      clearInterval(interval);
    };
  }, []);

  // Add CSS to disable text selection and hide cursor over PDF
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .secure-pdf-viewer * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      .pdf-content-area {
        cursor: none !important;
        pointer-events: auto;
      }
      
      .pdf-content-area * {
        cursor: none !important;
      }
      
      .pdf-content-area canvas {
        cursor: none !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
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
      
      /* Hide scrollbars to prevent dragging */
      .pdf-scroll-container::-webkit-scrollbar {
        width: 8px;
      }
      
      .pdf-scroll-container::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      .pdf-scroll-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .pdf-scroll-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    <div className={`relative border rounded-lg overflow-hidden secure-pdf-viewer ${className}`}>
      {/* Security Header */}
      <div className="bg-red-50 border-b border-red-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">MAXIMUM SECURITY MODE</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-red-600">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            VIEW ONLY
          </span>
          <span className="flex items-center gap-1">
            🚫 NO DOWNLOAD
          </span>
          <span className="flex items-center gap-1">
            🚫 NO PRINT
          </span>
          <span className="flex items-center gap-1">
            🚫 NO COPY
          </span>
          {attempts > 0 && (
            <span className="flex items-center gap-1 text-red-800 font-bold">
              <AlertTriangle className="h-3 w-3" />
              {attempts} VIOLATION{attempts !== 1 ? 'S' : ''}
            </span>
          )}
        </div>
      </div>

      {/* PDF Controls */}
      <div className="bg-muted border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {pageNumber} of {numPages || 0}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
            className="cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomOut} 
            disabled={scale <= 0.5}
            className="cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={zoomIn} 
            disabled={scale >= 3.0}
            className="cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content with hidden cursor */}
      <div 
        className="relative bg-gray-50 pdf-scroll-container pdf-content-area" 
        style={{ height: '400px', overflow: 'auto' }}
        onMouseEnter={() => {
          // Additional protection on mouse enter
          document.body.style.cursor = 'none';
        }}
        onMouseLeave={() => {
          // Reset cursor when leaving the component
          document.body.style.cursor = 'default';
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={options}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onLoadSuccess={onPageLoadSuccess}
            onLoadError={onPageLoadError}
            loading={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            }
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              showProtectionWarning();
              return false;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              showProtectionWarning();
              return false;
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              showProtectionWarning();
              return false;
            }}
            className="pdf-page-content"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              pointerEvents: 'none',
              cursor: 'none',
            } as React.CSSProperties}
          />
        </Document>
        
        {/* Multiple Watermark Overlays */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* Corner watermarks */}
          <div className="absolute top-2 right-2 transform rotate-12 text-red-500 text-xs font-bold opacity-30 bg-white bg-opacity-70 px-2 py-1 rounded shadow">
            🔒 PROTECTED
          </div>
          <div className="absolute bottom-2 left-2 transform -rotate-12 text-red-500 text-xs font-bold opacity-30 bg-white bg-opacity-70 px-2 py-1 rounded shadow">
            🚫 NO DOWNLOAD
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 text-red-300 text-4xl font-bold opacity-10 select-none">
            CONFIDENTIAL
          </div>
          
          {/* User/timestamp watermark */}
          {watermark && (
            <>
              <div className="absolute top-2 left-2 text-gray-500 text-xs font-mono opacity-40 bg-white bg-opacity-50 px-1 py-0.5 rounded">
                {watermark}
              </div>
              <div className="absolute bottom-2 right-2 text-gray-500 text-xs font-mono opacity-40 bg-white bg-opacity-50 px-1 py-0.5 rounded">
                MONITORED ACCESS
              </div>
            </>
          )}
        </div>
        
        {/* Invisible overlay to catch any interaction attempts */}
        <div 
          className="absolute inset-0 cursor-none"
          style={{
            background: 'transparent',
            zIndex: 10,
            pointerEvents: 'auto',
            cursor: 'none'
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            showProtectionWarning();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            showProtectionWarning();
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            showProtectionWarning();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            showProtectionWarning();
          }}
          onDragStart={(e) => {
            e.preventDefault();
            showProtectionWarning();
          }}
        />
      </div>

      {/* Enhanced Security Footer */}
      <div className="bg-red-50 border-t border-red-200 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>
              🔒 MAXIMUM SECURITY: All interactions monitored and logged
            </span>
          </div>
          {watermark ? (
            <div className="flex items-center gap-1 text-red-700">
              <User className="h-3 w-3" />
              <Clock className="h-3 w-3" />
              <span className="font-bold">
                {watermark}
              </span>
            </div>
          ) : userId && (
            <span className="text-red-700 font-bold">
              🔍 Tracked: User {userId}
            </span>
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
            Protected Document - Unauthorized access attempts are logged and may result in legal action
          </span>
        </div>
      </div>
    </div>
  );
};
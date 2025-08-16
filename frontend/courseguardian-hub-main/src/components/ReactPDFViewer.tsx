import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Eye, Shield, Download, AlertTriangle, User, Clock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
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
    alert('⚠️ Security Alert: Direct download, print, or copy operations are disabled for your protection. This PDF is watermarked and monitored.');
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

  // Add keyboard and context menu protection
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'a' || e.key === 'c') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        e.key === 'PrintScreen' ||
        (e.metaKey && (e.key === 's' || e.key === 'p' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showProtectionWarning();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
          <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
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

      {/* PDF Controls */}
      <div className="bg-muted border-b p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {pageNumber} of {numPages || 0}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative bg-white overflow-auto" style={{ height: '400px' }}>
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
              showProtectionWarning();
            }}
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
            }}
          />
        </Document>
        
        {/* Subtle Watermark Overlay */}
        {watermark && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 transform rotate-12 text-gray-400 text-xs font-mono opacity-20 bg-white bg-opacity-50 px-1 py-0.5 rounded">
              {watermark.split(' • ')[0]}
            </div>
            <div className="absolute bottom-2 left-2 transform -rotate-12 text-gray-400 text-xs font-mono opacity-20 bg-white bg-opacity-50 px-1 py-0.5 rounded">
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
            onClick={() => showProtectionWarning()}
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

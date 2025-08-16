import React, { useEffect, useState } from 'react';

interface BlobPDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
}

export const BlobPDFViewer: React.FC<BlobPDFViewerProps> = ({
  pdfUrl,
  title,
  className = ""
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🎯 BlobPDFViewer rendering with URL:', pdfUrl);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching PDF as blob from:', pdfUrl);
        
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
        console.log('✅ PDF blob received, size:', blob.size, 'bytes');
        
        // Create object URL from blob
        objectUrl = URL.createObjectURL(blob);
        console.log('🔗 Created blob URL:', objectUrl);
        
        setBlobUrl(objectUrl);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Failed to load PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPDF();

    // Cleanup function
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        console.log('🗑️ Revoked blob URL');
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        <div className="bg-gray-100 p-2 border-b">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        <div className="bg-gray-100 p-2 border-b">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="w-full h-96 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p className="font-medium">Failed to load PDF</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-100 p-2 border-b">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-gray-500">Loaded via blob URL</p>
      </div>
      
      <div className="w-full h-96">
        {blobUrl && (
          <iframe
            src={blobUrl}
            className="w-full h-full border-0"
            title={title}
            onLoad={() => console.log('✅ Blob iframe loaded successfully')}
            onError={(e) => console.error('❌ Blob iframe error:', e)}
          />
        )}
      </div>
    </div>
  );
};

import React, { useState, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FaTimes, FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../services/api';
import taskService from '../services/taskService';

// Configure PDF.js worker - use a data URI to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  taskId: string;
  attachmentId: string;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName, taskId, attachmentId, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Fetch PDF with authentication headers
  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching PDF from URL:', fileUrl);

        // Use the endpoint directly instead of constructing the full URL
        const endpoint = `/tasks/${taskId}/attachments/${attachmentId}/download`;
        console.log('Using endpoint:', endpoint);

        const response = await api.get(endpoint, {
          responseType: 'blob',
        });

        console.log('PDF response received:', response.status, response.headers['content-type']);

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', blobUrl);
        console.log('Blob size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        setPdfBlobUrl(blobUrl);
      } catch (err: any) {
        console.error('Error fetching PDF:', err);
        console.error('Error details:', err.response?.status, err.response?.data);
        setError(`Failed to load PDF: ${err.response?.status || err.message}. Please try downloading the file instead.`);
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [taskId, attachmentId]); // Remove fileUrl dependency since we're constructing the endpoint

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF document:', error);
    console.error('PDF.js version:', pdfjs.version);
    console.error('Worker src:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.error('PDF blob URL:', pdfBlobUrl);
    setError(`Failed to render PDF: ${error.message}. Please try downloading the file instead.`);
    setLoading(false);
  }, [pdfBlobUrl]);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  };

  const handleDownload = async () => {
    try {
      await taskService.downloadAttachment(taskId, attachmentId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h3>
            {numPages && (
              <span className="text-sm text-gray-500">
                Page {pageNumber} of {numPages}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
              title="Download PDF"
            >
              <FaDownload />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading PDF...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download Instead
              </button>
            </div>
          )}

          {pdfBlobUrl && (
            <div className="flex flex-col items-center">
              <Document
                file={pdfBlobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Rendering PDF...</span>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-4">Failed to render PDF document</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                  loading={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Rendering page...</span>
                    </div>
                  }
                />
              </Document>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        {numPages && numPages > 1 && !loading && !error && (
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Page</span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={pageNumber}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= numPages) {
                    setPageNumber(page);
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
              <span className="text-sm text-gray-600">of {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;

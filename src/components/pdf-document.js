import PropTypes from 'prop-types';
import { Empty, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { pdfjs, Document, Page } from 'react-pdf';
import DimensionsProvider from './dimensions-provider.js';
import EmptyState, { EMPTY_STATE_STATUS } from './empty-state.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = '/api/v1/pdfjs-dist/build/pdf.worker.min.js';

function PdfDocument({ file, pageNumber, showTextOverlay, onLoadSuccess }) {
  const viewerRef = useRef();
  const isMounted = useRef(false);
  const { t } = useTranslation('pdfDocument');
  const [viewerStyle, setViewerStyle] = useState({});
  const [actualPageNumber, setActualPageNumber] = useState(pageNumber);
  const [viewerViewportPadding, setViewerViewportPadding] = useState(0);

  const releaseViewerStyle = () => setTimeout(() => {
    if (isMounted.current) {
      setViewerStyle({});
    }
  }, 0);

  useEffect(() => {
    isMounted.current = true;
    // In order to not have flickering on the page while the new page renders we keep the dimensions
    // of the old page fixed until `handlePageRenderSuccess` has been called by the next page,
    // or any of the error components are rendered.
    const boundingClientRect = viewerRef.current.getBoundingClientRect();
    setViewerStyle({ height: boundingClientRect.height, width: boundingClientRect.width });
    setViewerViewportPadding(window.innerWidth - boundingClientRect.width);

    setActualPageNumber(pageNumber);

    return () => {
      isMounted.current = false;
    };
  }, [pageNumber]);

  useEffect(() => {
    const handleResize = () => {
      const viewerBoundingClientRect = viewerRef.current.getBoundingClientRect();
      const currentViewerViewportPadding = window.innerWidth - viewerBoundingClientRect.width;

      const viewerWidthOverflow = viewerViewportPadding - currentViewerViewportPadding;
      if (viewerWidthOverflow > 0) {
        const reducedWidth = viewerBoundingClientRect.width - viewerWidthOverflow;
        setViewerStyle({ height: viewerBoundingClientRect.height, width: reducedWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [viewerViewportPadding]);

  const handlePageRenderSuccess = () => {
    releaseViewerStyle();
  };

  const renderLoadingComponent = () => {
    releaseViewerStyle();
    return (
      <Empty description={t('loadingDocument')} image={<Spin size="large" />} />
    );
  };

  const renderNoDataComponent = () => {
    releaseViewerStyle();
    return null;
  };

  const renderDocumentErrorComponent = () => {
    releaseViewerStyle();
    return (
      <EmptyState
        title={t('pdfRenderingEmptyStateTitle')}
        status={EMPTY_STATE_STATUS.error}
        subtitle={t('pdfRenderingEmptyStateSubtitle')}
        />
    );
  };

  const renderPageErrorComponent = () => {
    releaseViewerStyle();
    return (
      <EmptyState
        title={t('pdfPageRenderingEmptyStateTitle')}
        status={EMPTY_STATE_STATUS.warning}
        subtitle={t('pdfPageRenderingEmptyStateSubtitle')}
        />
    );
  };

  const documentOptions = useMemo(() => ({
    cMapUrl: '/api/v1/pdfjs-dist/cmaps',
    cMapPacked: true
  }), []);

  return (
    <DimensionsProvider>
      {({ containerWidth }) => (
        <div className="PdfDocument" style={viewerStyle} ref={viewerRef}>
          <Document
            options={documentOptions}
            file={file}
            renderMode="canvas"
            loading={renderLoadingComponent}
            noData={renderNoDataComponent}
            error={renderDocumentErrorComponent}
            onLoadSuccess={onLoadSuccess}
            >
            <Page
              key={actualPageNumber}
              pageNumber={actualPageNumber}
              height={null}
              width={containerWidth}
              error={renderPageErrorComponent}
              renderTextLayer={showTextOverlay}
              onRenderSuccess={handlePageRenderSuccess}
              />
          </Document>
        </div>
      )}
    </DimensionsProvider>
  );
}

PdfDocument.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    withCredentials: PropTypes.bool
  }),
  onLoadSuccess: PropTypes.func,
  pageNumber: PropTypes.number,
  showTextOverlay: PropTypes.bool,
};

PdfDocument.defaultProps = {
  file: null,
  onLoadSuccess: () => {},
  pageNumber: 1,
  showTextOverlay: false
};

export default PdfDocument;

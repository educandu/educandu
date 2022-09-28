import { SOURCE_TYPE } from './constants.js';
import React, { useMemo, useState } from 'react';
import Markdown from '../../components/markdown.js';
import MiniPager from '../../components/mini-pager.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PdfDocument, { PDF_DOCUMENT_STRETCH_DIRECTION } from '../../components/pdf-document.js';

function PdfViewerDisplay({ content }) {
  const { sourceType, sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const [pdf, setPdf] = useState(null);
  const clientConfig = useService(ClientConfig);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);

  const fileObject = useMemo(() => {
    if (sourceType !== SOURCE_TYPE.internal) {
      throw new Error(`Invalid source type '${sourceType}'`);
    }

    return sourceUrl
      ? { url: `${clientConfig.cdnRootUrl}/${sourceUrl}`, withCredentials: true }
      : null;
  }, [sourceType, sourceUrl, clientConfig.cdnRootUrl]);

  const onDocumentLoadSuccess = loadedPdfDocument => {
    setPdf(loadedPdfDocument);
    setPageNumber(initialPageNumber);
  };

  return (
    <div className="PdfViewerDisplay">
      <div className={`PdfViewerDisplay-viewer u-width-${width || 100}`}>
        <PdfDocument
          file={fileObject}
          pageNumber={pageNumber}
          stretchDirection={PDF_DOCUMENT_STRETCH_DIRECTION.horizontal}
          showTextOverlay={showTextOverlay}
          onLoadSuccess={onDocumentLoadSuccess}
          />
      </div>
      {!!caption && (
        <div className={`PdfViewerDisplay-caption u-width-${width || 100}`}>
          <Markdown inline>{caption}</Markdown>
        </div>
      )}
      {pdf?.numPages > 1 && (
        <MiniPager
          currentPage={pageNumber}
          totalPages={pdf?.numPages || 0}
          onNavigate={setPageNumber}
          />
      )}
    </div>
  );
}

PdfViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default PdfViewerDisplay;

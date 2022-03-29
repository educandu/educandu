import React, { useRef, useState } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import Markdown from '../../../components/markdown.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { pluginControllerApiPath, SOURCE_TYPE } from '../constants.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import DimensionsProvider from '../../interval-trainer/display/dimensions-provider.js';
import { BackwardOutlined, CaretLeftOutlined, CaretRightOutlined, ForwardOutlined } from '@ant-design/icons';

pdfjs.GlobalWorkerOptions.workerSrc = `${pluginControllerApiPath}/pdfjs-dist/build/pdf.worker.min.js`;

function PdfViewerDisplay({ content }) {
  const viewerRef = useRef();
  const [pdf, setPdf] = useState(null);
  const clientConfig = useService(ClientConfig);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewerStyle, setViewerStyle] = useState({});

  const { sourceType, sourceUrl, renderMode, showTextOverlay, width, caption } = content;

  const onDocumentLoadSuccess = loadedPdfDocument => {
    setPdf(loadedPdfDocument);
    setPageNumber(1);
  };

  const navigate = newPageNumber => {
    // In order to not have flickering on the page while the new page renders we keep the height
    // of the old page height fixed until `handlePageRenderSuccess` has been called by the next page.
    setViewerStyle({ height: viewerRef.current.getBoundingClientRect().height });
    setPageNumber(newPageNumber);
  };

  const handleFirstPageButtonClick = () => {
    navigate(1);
  };

  const handleLastPageButtonClick = () => {
    navigate(pdf.numPages);
  };

  const handlePreviousPageButtonClick = () => {
    navigate(pageNumber - 1);
  };

  const handleNextPageButtonClick = () => {
    navigate(pageNumber + 1);
  };

  const handlePageRenderSuccess = () => {
    setTimeout(() => setViewerStyle({}), 0);
  };

  let url;
  switch (sourceType) {
    case SOURCE_TYPE.internal:
      url = sourceUrl ? `${clientConfig.cdnRootUrl}/${sourceUrl}` : null;
      break;
    case SOURCE_TYPE.external:
      url = sourceUrl || null;
      break;
    default:
      throw new Error(`Invalid source type '${sourceType}'`);
  }

  return (
    <div className="PdfViewer">
      <div className={`PdfViewer-viewer u-width-${width || 100}`} style={viewerStyle} ref={viewerRef}>
        <DimensionsProvider>
          {({ containerWidth }) => (
            <Document
              options={{
                cMapUrl: `${pluginControllerApiPath}/pdfjs-dist/cmaps`,
                cMapPacked: true
              }}
              file={url}
              renderMode={renderMode}
              onLoadSuccess={onDocumentLoadSuccess}
              >
              <Page
                key={pageNumber}
                pageNumber={pageNumber}
                width={containerWidth}
                renderTextLayer={showTextOverlay}
                onRenderSuccess={handlePageRenderSuccess}
                />
            </Document>
          )}
        </DimensionsProvider>
      </div>
      {!!caption && (
        <div className={`PdfViewer-caption u-width-${width || 100}`}>
          <Markdown inline>{caption}</Markdown>
        </div>
      )}
      {pdf?.numPages > 1 && (
        <div className="PdfViewer-pager">
          <a className="PdfViewer-pagerItem" disabled={pageNumber <= 1} onClick={handleFirstPageButtonClick}><BackwardOutlined /></a>
          <a className="PdfViewer-pagerItem" disabled={pageNumber <= 1} onClick={handlePreviousPageButtonClick}><CaretLeftOutlined /></a>
          <span className="PdfViewer-pagerItem">{pageNumber}&nbsp;/&nbsp;{pdf.numPages}</span>
          <a className="PdfViewer-pagerItem" disabled={pageNumber >= pdf.numPages} onClick={handleNextPageButtonClick}><CaretRightOutlined /></a>
          <a className="PdfViewer-pagerItem" disabled={pageNumber >= pdf.numPages} onClick={handleLastPageButtonClick}><ForwardOutlined /></a>
        </div>
      )}
    </div>
  );
}

PdfViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default PdfViewerDisplay;

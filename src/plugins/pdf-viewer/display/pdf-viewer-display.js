import { useTranslation } from 'react-i18next';
import { pdfjs, Document, Page } from 'react-pdf';
import { Button, Empty, Result, Spin } from 'antd';
import Markdown from '../../../components/markdown.js';
import React, { useMemo, useRef, useState } from 'react';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { pluginControllerApiPath, SOURCE_TYPE } from '../constants.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import DimensionsProvider from '../../interval-trainer/display/dimensions-provider.js';
import { BackwardOutlined, CaretLeftOutlined, CaretRightOutlined, ForwardOutlined } from '@ant-design/icons';

pdfjs.GlobalWorkerOptions.workerSrc = `${pluginControllerApiPath}/pdfjs-dist/build/pdf.worker.min.js`;

function PdfViewerDisplay({ content }) {
  const { sourceType, sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const viewerRef = useRef();
  const [pdf, setPdf] = useState(null);
  const { t } = useTranslation('pdfViewer');
  const clientConfig = useService(ClientConfig);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);
  const [viewerStyle, setViewerStyle] = useState({});

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

  const renderLoadingComponent = () => (
    <Empty description={t('loadingDocument')} image={<Spin size="large" />} />
  );

  const renderNoDataComponent = () => (
    <Empty description={t('noDocument')} />
  );

  const renderDocumentErrorComponent = () => (
    <Result
      status="warning"
      title={t('common:error')}
      subTitle={t('errorRenderingDocument')}
      />
  );

  const renderPageErrorComponent = () => (
    <Result
      status="warning"
      title={t('common:error')}
      subTitle={t('errorRenderingPage')}
      />
  );

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
              file={fileObject}
              renderMode="canvas"
              loading={renderLoadingComponent}
              noData={renderNoDataComponent}
              error={renderDocumentErrorComponent}
              onLoadSuccess={onDocumentLoadSuccess}
              >
              <Page
                key={pageNumber}
                pageNumber={pageNumber}
                width={containerWidth}
                error={renderPageErrorComponent}
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
          <Button type="link" className="PdfViewer-pagerItem" disabled={pageNumber <= 1} onClick={handleFirstPageButtonClick}><BackwardOutlined /></Button>
          <Button type="link" className="PdfViewer-pagerItem" disabled={pageNumber <= 1} onClick={handlePreviousPageButtonClick}><CaretLeftOutlined /></Button>
          <span className="PdfViewer-pagerItem">{pageNumber}&nbsp;/&nbsp;{pdf.numPages}</span>
          <Button type="link" className="PdfViewer-pagerItem" disabled={pageNumber >= pdf.numPages} onClick={handleNextPageButtonClick}><CaretRightOutlined /></Button>
          <Button type="link" className="PdfViewer-pagerItem" disabled={pageNumber >= pdf.numPages} onClick={handleLastPageButtonClick}><ForwardOutlined /></Button>
        </div>
      )}
    </div>
  );
}

PdfViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default PdfViewerDisplay;

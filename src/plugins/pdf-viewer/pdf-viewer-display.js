import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import Markdown from '../../components/markdown.js';
import MiniPager from '../../components/mini-pager.js';
import PdfDocument from '../../components/pdf-document.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { useIsMounted, useOnComponentUnmount } from '../../ui/hooks.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

function PdfViewerDisplay({ content }) {
  const { sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const isMounted = useIsMounted();
  const [pdf, setPdf] = useState(null);
  const { t } = useTranslation('pdfViewer');
  const clientConfig = useService(ClientConfig);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);

  const [fileObject, fileName] = useMemo(() => {
    if (!sourceUrl) {
      return [null, null];
    }

    const url = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const withCredentials = isInternalSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });
    const newFileName = urlUtils.getFileName(url);
    return [{ url, withCredentials }, newFileName];
  }, [sourceUrl, clientConfig.cdnRootUrl]);

  const handleDocumentLoadSuccess = loadedPdfDocument => {
    setPdf(loadedPdfDocument);
    setPageNumber(initialPageNumber);
  };

  useEffect(() => {
    (async () => {
      if (!pdf) {
        setDownloadUrl(null);
      } else {
        const data = await pdf.getData();
        if (isMounted.current) {
          setDownloadUrl(oldDownloadUrl => {
            if (oldDownloadUrl) {
              setTimeout(() => URL.revokeObjectURL(oldDownloadUrl), 0);
            }

            return URL.createObjectURL(new Blob([data]));
          });
        }
      }
    })();
  }, [pdf, isMounted]);

  useOnComponentUnmount(() => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  });

  return (
    <div className="PdfViewerDisplay">
      <div className={`PdfViewerDisplay-viewer u-width-${width || 100}`}>
        <PdfDocument
          file={fileObject}
          pageNumber={pageNumber}
          showTextOverlay={showTextOverlay}
          onLoadSuccess={handleDocumentLoadSuccess}
          />
      </div>
      {!!caption && (
        <div className={`PdfViewerDisplay-caption u-width-${width || 100}`}>
          <Markdown inline>{caption}</Markdown>
        </div>
      )}
      <MiniPager
        currentPage={pageNumber}
        totalPages={pdf?.numPages || 0}
        onNavigate={setPageNumber}
        />
      {!!downloadUrl && !!fileName && (
        <a
          className="PdfViewerDisplay-downloadLink"
          download={fileName}
          href={downloadUrl}
          >
          {t('downloadLinkText')}
        </a>
      )}
    </div>
  );
}

PdfViewerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default PdfViewerDisplay;

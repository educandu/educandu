import PropTypes from 'prop-types';
import MiniPager from '../../mini-pager.js';
import React, { useEffect, useState } from 'react';
import { useService } from '../../container-context.js';
import MediaPlayer from '../../media-player/media-player.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getResourceType } from '../../../utils/resource-utils.js';
import { browserFileType } from '../../../ui/default-prop-types.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../../domain/constants.js';
import FileUnknownFilledIcon from '../../icons/files/file-unknown-filled-icon.js';
import PdfDocument, { PDF_DOCUMENT_STRETCH_DIRECTION } from '../../pdf-document.js';
import { getAccessibleUrl, isInternalSourceType } from '../../../utils/source-utils.js';

function ResourcePreview({ urlOrFile, onResourceLoad }) {
  const [pdf, setPdf] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const clientConfig = useService(ClientConfig);
  const [sourceUrl, setSourceUrl] = useState(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [resourceType, setResourceType] = useState(RESOURCE_TYPE.none);

  useEffect(() => {
    if (typeof urlOrFile === 'string') {
      const accessibleUrl = getAccessibleUrl({ url: urlOrFile, cdnRootUrl: clientConfig.cdnRootUrl });
      setSourceUrl(accessibleUrl);
      setResourceType(getResourceType(accessibleUrl));
      setPdfFile({ url: accessibleUrl, withCredentials: isInternalSourceType({ url: accessibleUrl, cdnRootUrl: clientConfig.cdnRootUrl }) });
      setPdfPageNumber(1);
      return () => {};
    }
    if (urlOrFile instanceof File) {
      const objectUrl = URL.createObjectURL(urlOrFile);
      setSourceUrl(objectUrl);
      setResourceType(getResourceType(urlOrFile.name));
      setPdfFile({ url: objectUrl });
      setPdfPageNumber(1);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setSourceUrl(null);
    setResourceType(RESOURCE_TYPE.none);
    setPdfFile({ url: null });
    setPdfPageNumber(1);
    return () => {};
  }, [urlOrFile, clientConfig]);

  const handleImageLoad = event => {
    onResourceLoad({ resourceType, width: event.target.naturalWidth, height: event.target.naturalHeight });
  };

  const handlePdfLoad = loadedPdf => {
    setPdf(loadedPdf);
    onResourceLoad({ resourceType, numPages: loadedPdf.numPages });
  };

  const handleMediaLoad = durationInMilliseconds => {
    onResourceLoad({ resourceType, durationInMilliseconds });
  };

  const renderAudio = () => (
    <MediaPlayer sourceUrl={sourceUrl} canDownload screenMode={MEDIA_SCREEN_MODE.none} onDuration={handleMediaLoad} />
  );

  const renderVideo = () => (
    <MediaPlayer sourceUrl={sourceUrl} canDownload onDuration={handleMediaLoad} />
  );

  const renderImage = () => (
    <img className="ResourcePreview-image" src={sourceUrl} onLoad={handleImageLoad} />
  );

  const renderPdf = () => (
    <div className="ResourcePreview-pdf">
      <div className="ResourcePreview-pdfDocument">
        <PdfDocument
          file={pdfFile}
          pageNumber={pdfPageNumber}
          stretchDirection={PDF_DOCUMENT_STRETCH_DIRECTION.horizontal}
          onLoadSuccess={handlePdfLoad}
          />
      </div>
      <div className="ResourcePreview-pdfPager">
        {pdf?.numPages > 1 && (
          <MiniPager
            currentPage={pdfPageNumber}
            totalPages={pdf?.numPages || 0}
            onNavigate={setPdfPageNumber}
            />
        )}
      </div>
    </div>
  );

  const renderGenericFile = () => (
    <div className="ResourcePreview-icon"><FileUnknownFilledIcon /></div>
  );

  const renderNothing = () => null;

  let renderPreview;
  switch (resourceType) {
    case RESOURCE_TYPE.audio:
      renderPreview = renderAudio;
      break;
    case RESOURCE_TYPE.video:
      renderPreview = renderVideo;
      break;
    case RESOURCE_TYPE.image:
      renderPreview = renderImage;
      break;
    case RESOURCE_TYPE.pdf:
      renderPreview = renderPdf;
      break;
    case RESOURCE_TYPE.unknown:
      renderPreview = renderGenericFile;
      break;
    case RESOURCE_TYPE.none:
      renderPreview = renderNothing;
      break;
    default:
      throw new Error(`Cannot render resource type '${resourceType}'`);
  }

  return (
    <div className="ResourcePreview">
      <div className="ResourcePreview-previewArea">
        {renderPreview()}
      </div>
    </div>
  );
}

ResourcePreview.propTypes = {
  urlOrFile: PropTypes.oneOfType([
    PropTypes.string,
    browserFileType
  ]).isRequired,
  onResourceLoad: PropTypes.func
};

ResourcePreview.defaultProps = {
  onResourceLoad: () => {}
};

export default ResourcePreview;

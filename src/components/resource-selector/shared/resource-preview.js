import PropTypes from 'prop-types';
import classNames from 'classnames';
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
    <div className="ResourcePreview-mediaPlayer">
      <MediaPlayer sourceUrl={sourceUrl} canDownload screenMode={MEDIA_SCREEN_MODE.none} onDuration={handleMediaLoad} />
    </div>
  );

  const renderVideo = () => (
    <div className="ResourcePreview-mediaPlayer">
      <MediaPlayer sourceUrl={sourceUrl} canDownload onDuration={handleMediaLoad} />
    </div>
  );

  const renderImage = () => (
    <div className="ResourcePreview-image" >
      <img src={sourceUrl} onLoad={handleImageLoad} />
    </div>
  );

  const renderPdf = () => (
    <div className="ResourcePreview-pdf">
      <PdfDocument
        file={pdfFile}
        pageNumber={pdfPageNumber}
        stretchDirection={PDF_DOCUMENT_STRETCH_DIRECTION.horizontal}
        onLoadSuccess={handlePdfLoad}
        />
      {pdf?.numPages > 1 && (
      <MiniPager
        currentPage={pdfPageNumber}
        totalPages={pdf?.numPages || 0}
        onNavigate={setPdfPageNumber}
        />
      )}
    </div>
  );

  const renderGenericFile = () => (
    <div className="ResourcePreview-icon"><FileUnknownFilledIcon /></div>
  );

  return (
    <div className={classNames('ResourcePreview', { 'ResourcePreview--pdf': resourceType === RESOURCE_TYPE.pdf })}>
      {resourceType === RESOURCE_TYPE.audio && renderAudio()}
      {resourceType === RESOURCE_TYPE.video && renderVideo()}
      {resourceType === RESOURCE_TYPE.image && renderImage()}
      {resourceType === RESOURCE_TYPE.pdf && renderPdf()}
      {resourceType === RESOURCE_TYPE.unknown && renderGenericFile()}
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

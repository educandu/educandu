import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import MiniPager from '../mini-pager.js';
import { message, Tooltip } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import LiteralUrlLink from '../literal-url-link.js';
import { useService } from '../container-context.js';
import { handleError } from '../../ui/error-helper.js';
import { useDateFormat } from '../locale-context.js';
import mimeTypeHelper from '../../ui/mime-type-helper.js';
import MediaPlayer from '../media-player/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getResourceType } from '../../utils/resource-utils.js';
import FileTextFilledIcon from '../icons/files/file-text-filled-icon.js';
import { MEDIA_SCREEN_MODE, RESOURCE_TYPE } from '../../domain/constants.js';
import CopyToClipboardIcon from '../icons/general/copy-to-clipboard-icon.js';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import FileUnknownFilledIcon from '../icons/files/file-unknown-filled-icon.js';
import PdfDocument, { PDF_DOCUMENT_STRETCH_DIRECTION } from '../pdf-document.js';

const logger = new Logger(import.meta.url);

export const RESOURCE_PREVIEW_LAYOUT = {
  default: 'default',
  compact: 'compact',
  thumbnailOnly: 'thumbnail-only'
};

function ResourcePreview({ createdOn, updatedOn, size, url, layout }) {
  const imageRef = useRef();
  const { t } = useTranslation();
  const [pdf, setPdf] = useState(null);
  const { formatDate } = useDateFormat();
  const clientConfig = useService(ClientConfig);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [imageDimensions, setImageDimensions] = useState(null);

  const parsedUrl = new URL(url);
  const resourceType = getResourceType(parsedUrl.href);
  const fileName = decodeURIComponent(parsedUrl.pathname.slice(parsedUrl.pathname.lastIndexOf('/') + 1));
  const category = mimeTypeHelper.getCategory(fileName);

  const pdfFile = useMemo(() => ({
    url,
    withCredentials: url.startsWith(clientConfig.cdnRootUrl)
  }), [url, clientConfig.cdnRootUrl]);

  const handleCopyUrlToClipboardClick = async event => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await window.navigator.clipboard.writeText(url);
      message.success(t('common:urlCopiedToClipboard'));
    } catch (error) {
      handleError({ message: t('common:copyUrlToClipboardError'), error, logger, t, duration: 30 });
    }
  };

  useEffect(() => {
    const image = imageRef.current;
    if (!image) {
      return () => {};
    }

    const setDimensions = img => {
      if (img.naturalHeight && img.naturalWidth) {
        setImageDimensions({ height: img.naturalHeight, width: img.naturalWidth });
      } else {
        setImageDimensions(null);
      }
    };

    if (image.complete) {
      setDimensions(image);
    } else {
      image.onload = () => setDimensions(image);
      image.onerror = () => setImageDimensions(null);
    }

    return () => setImageDimensions(null);
  }, [imageRef]);

  const renderAudio = () => (
    <MediaPlayer source={url} canDownload screenMode={MEDIA_SCREEN_MODE.none} />
  );

  const renderVideo = () => (
    <MediaPlayer source={url} canDownload />
  );

  const renderImage = () => (
    <img className="FilePreview-image" src={url} ref={imageRef} />
  );

  const renderPdf = () => (
    <div className="FilePreview-pdf">
      <div className="FilePreview-pdfDocument">
        <PdfDocument
          file={pdfFile}
          pageNumber={pdfPageNumber}
          stretchDirection={PDF_DOCUMENT_STRETCH_DIRECTION.horizontal}
          onLoadSuccess={setPdf}
          />
      </div>
      <div className="FilePreview-pdfPager">
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

  const renderText = () => (
    <div className="FilePreview-icon"><FileTextFilledIcon /></div>
  );

  const renderGenericFile = () => (
    <div className="FilePreview-icon"><FileUnknownFilledIcon /></div>
  );

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
    case RESOURCE_TYPE.text:
      renderPreview = renderText;
      break;
    default:
      renderPreview = renderGenericFile;
  }

  const renderDetails = () => {
    return (
      <Fragment>
        <div className="FilePreview-detailLabel">
          {t('common:name')}
        </div>
        <div className="FilePreview-detailValue">
          {fileName}
        </div>
        <div className="FilePreview-detailLabel">
          {t('common:type')}
        </div>
        <div className="FilePreview-detailValue">
          {mimeTypeHelper.localizeCategory(category, t)}
        </div>
        {typeof size === 'number' && (
          <Fragment>
            <div className="FilePreview-detailLabel">
              {t('common:size')}
            </div>
            <div className="FilePreview-detailValue">
              {prettyBytes(size)}
            </div>
          </Fragment>
        )}
        {!!createdOn && (
          <Fragment>
            <div className="FilePreview-detailLabel">
              {t('common:createdOn')}
            </div>
            <div className="FilePreview-detailValue">
              {formatDate(createdOn)}
            </div>
          </Fragment>
        )}
        {!!updatedOn && (
          <Fragment>
            <div className="FilePreview-detailLabel">
              {t('common:updatedOn')}
            </div>
            <div className="FilePreview-detailValue">
              {formatDate(updatedOn)}
            </div>
          </Fragment>
        )}
        {!!imageDimensions && (
          <Fragment>
            <div className="FilePreview-detailLabel">
              {t('common:naturalSize')}
            </div>
            <div className="FilePreview-detailValue">
              {imageDimensions.width}&nbsp;⨉&nbsp;{imageDimensions.height}&nbsp;px
            </div>
          </Fragment>
        )}
        {!!pdf && (
          <Fragment>
            <div className="FilePreview-detailLabel">
              {t('common:pageCount')}
            </div>
            <div className="FilePreview-detailValue">
              {pdf.numPages}
            </div>
          </Fragment>
        )}
        <div className="FilePreview-detailLabel">
          {t('common:url')}
          &nbsp;&nbsp;
          <Tooltip title={t('common:copyUrlToClipboard')}>
            <a onClick={handleCopyUrlToClipboardClick}><CopyToClipboardIcon /></a>
          </Tooltip>
        </div>
        <div className="FilePreview-detailValue">
          <LiteralUrlLink href={url} targetBlank />
        </div>
      </Fragment>
    );
  };

  return (
    <div
      className={classNames({
        'FilePreview': true,
        'FilePreview--compact': layout === RESOURCE_PREVIEW_LAYOUT.compact,
        'FilePreview--thumbnailOnly': layout === RESOURCE_PREVIEW_LAYOUT.thumbnailOnly
      })}
      >
      <div
        className={classNames({
          'FilePreview-previewArea': true,
          'FilePreview-previewArea--compact': layout === RESOURCE_PREVIEW_LAYOUT.compact,
          'FilePreview-previewArea--thumbnailOnly': layout === RESOURCE_PREVIEW_LAYOUT.thumbnailOnly
        })}
        >
        {renderPreview()}
      </div>
      {layout !== RESOURCE_PREVIEW_LAYOUT.thumbnailOnly && (
        <div
          className={classNames({
            'FilePreview-detailsArea': true,
            'FilePreview-detailsArea--compact': layout === RESOURCE_PREVIEW_LAYOUT.compact
          })}
          >
          {renderDetails()}
        </div>
      )}
    </div>
  );
}

ResourcePreview.propTypes = {
  createdOn: PropTypes.string,
  layout: PropTypes.oneOf(Object.values(RESOURCE_PREVIEW_LAYOUT)),
  size: PropTypes.number,
  updatedOn: PropTypes.string,
  url: PropTypes.string.isRequired
};

ResourcePreview.defaultProps = {
  createdOn: null,
  layout: RESOURCE_PREVIEW_LAYOUT.default,
  size: null,
  updatedOn: null
};

export default ResourcePreview;

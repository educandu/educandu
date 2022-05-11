import React from 'react';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import LiteralUrlLink from './literal-url-link.js';
import { useDateFormat } from './locale-context.js';
import mimeTypeHelper from '../ui/mime-type-helper.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import { getResourceType } from '../utils/resource-utils.js';
import { FileOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';

function FilePreview({ lastModified, size, url }) {
  const { t } = useTranslation('filePreview');
  const { formatDate } = useDateFormat();

  const parsedUrl = new URL(url);
  const resourceType = getResourceType(parsedUrl.href);
  const fileName = decodeURIComponent(parsedUrl.pathname.slice(parsedUrl.pathname.lastIndexOf('/') + 1));
  const category = mimeTypeHelper.getCategory(fileName);

  const renderAudio = () => (
    <MediaPlayer sourceUrl={url} audioOnly />
  );

  const renderVideo = () => (
    <MediaPlayer sourceUrl={url} />
  );

  const renderImage = () => (
    <img className="FilePreview-image" src={url} />
  );

  const renderPdf = () => (
    <div className="FilePreview-icon"><FilePdfOutlined /></div>
  );

  const renderText = () => (
    <div className="FilePreview-icon"><FileTextOutlined /></div>
  );

  const renderGenericFile = () => (
    <div className="FilePreview-icon"><FileOutlined /></div>
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

  return (
    <div className="FilePreview">
      <div className="FilePreview-headerArea">
        {fileName}
      </div>
      <div className="FilePreview-previewArea">
        {renderPreview()}
      </div>
      <div className="FilePreview-detailsArea">
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
        <div className="FilePreview-detailLabel">
          {t('common:size')}
        </div>
        <div className="FilePreview-detailValue">
          {prettyBytes(size)}
        </div>
        <div className="FilePreview-detailLabel">
          {t('common:createdOn')}
        </div>
        <div className="FilePreview-detailValue">
          {formatDate(lastModified)}
        </div>
        <div className="FilePreview-detailLabel">
          {t('common:url')}
        </div>
        <div className="FilePreview-detailValue">
          <LiteralUrlLink rel="noopener noreferrer" target="_blank" href={url} />
        </div>
      </div>
    </div>
  );
}

FilePreview.propTypes = {
  lastModified: PropTypes.instanceOf(Date).isRequired,
  size: PropTypes.number.isRequired,
  url: PropTypes.string.isRequired
};

export default FilePreview;

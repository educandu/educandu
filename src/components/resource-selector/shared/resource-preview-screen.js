import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import ResourceUrl from './resource-url.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useService } from '../../container-context.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import ResourcePreviewWithMetadata from './resource-preview-with-metadata.js';
import MediaLibraryMetadataDisplay from '../media-library/media-library-metadata-display.js';
import { mediaLibraryItemShape, roomMediaItemShape, wikimediaFileShape } from '../../../ui/default-prop-types.js';

function ResourcePreviewScreen({ file, renderMediaLibraryMetadata, onBackClick, onCancelClick, onSelectClick }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('resourcePreviewScreen');

  const renderFileName = () => {
    const accessibleUrl = getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl });
    return decodeURIComponent(urlUtils.getFileName(accessibleUrl));
  };

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('headline')}</h3>
      <div className="u-overflow-auto">
        {!!renderMediaLibraryMetadata && (
          <div className="ResourcePreviewScreen u-resource-selector-screen-content-rows">
            <div className="u-resource-selector-screen-file-name">{renderFileName()}</div>
            <div className="u-resource-selector-screen-content-split">
              <ResourcePreviewWithMetadata urlOrFile={file.url} size={file.size} />
              <MediaLibraryMetadataDisplay mediaLibraryItem={file} />
            </div>
            <ResourceUrl url={file.url} />
          </div>
        )}
        {!renderMediaLibraryMetadata && (
          <ResourcePreviewWithMetadata urlOrFile={file.url} size={file.size} showName showUrl />
        )}
      </div>

      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick}>{t('common:cancel')}</Button>
          <Button type="primary" onClick={onSelectClick}>{t('common:select')}</Button>
        </div>
      </div>
    </div>
  );
}

ResourcePreviewScreen.propTypes = {
  file: PropTypes.oneOfType([roomMediaItemShape, mediaLibraryItemShape, wikimediaFileShape]).isRequired,
  renderMediaLibraryMetadata: PropTypes.bool,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired
};

ResourcePreviewScreen.defaultProps = {
  renderMediaLibraryMetadata: false
};

export default ResourcePreviewScreen;

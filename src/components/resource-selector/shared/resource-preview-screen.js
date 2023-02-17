import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import ResourceUrl from './resource-url.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import { useLocale } from '../../locale-context.js';
import ResourceDetails from './resource-details.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useService } from '../../container-context.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../../utils/source-utils.js';
import LanguageDataProvider from '../../../localization/language-data-provider.js';

function ResourcePreviewScreen({ file, renderMediaLibraryMetadata, onBackClick, onCancelClick, onSelectClick }) {
  const { uiLanguage } = useLocale();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('resourcePreviewScreen');
  const languageDataProvider = useService(LanguageDataProvider);

  const renderResourceDetails = previewOnly => (
    <ResourceDetails url={file.url} size={file.size} previewOnly={previewOnly} />
  );

  const renderFileName = () => {
    const accessibleUrl = getAccessibleUrl({ url: file.url, cdnRootUrl: clientConfig.cdnRootUrl });
    return decodeURIComponent(urlUtils.getFileName(accessibleUrl));
  };

  const renderLanguages = () => {
    return file.languages.map(language => {
      const { name } = languageDataProvider.getLanguageData(language, uiLanguage);
      return name;
    }).join(', ');
  };

  const renderMissingData = () => <i>{t('missingDataPlaceholder')}</i>;

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('headline')}</h3>
      <div className="u-overflow-auto">
        {!!renderMediaLibraryMetadata && (
          <div className="ResourcePreviewScreen u-resource-selector-screen-content-rows">
            <div className="u-resource-selector-screen-file-name">{renderFileName()}</div>
            <div className="u-resource-selector-screen-content-split">
              {renderResourceDetails(true)}
              <div className="ResourcePreviewScreen-metadata">
                <div>
                  <b>{t('common:description')}</b>
                  <div>{file.description || renderMissingData()}</div>
                </div>
                <div>
                  <b>{t('common:languages')}</b>
                  <div>{renderLanguages() || renderMissingData()}</div>
                </div>
                <div>
                  <b>{t('common:licenses')}</b>
                  <div>{file.licenses.join(', ')}</div>
                </div>
                <div>
                  <b>{t('common:tags')}</b>
                  <div>{file.tags.join(', ')}</div>
                </div>
              </div>
            </div>
            <ResourceUrl url={file.url} />
          </div>
        )}
        {!renderMediaLibraryMetadata && renderResourceDetails(false)}
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
  file: PropTypes.shape({
    url: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    description: PropTypes.string,
    languages: PropTypes.arrayOf(PropTypes.string),
    licenses: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  renderMediaLibraryMetadata: PropTypes.bool,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func.isRequired,
  onSelectClick: PropTypes.func.isRequired
};

ResourcePreviewScreen.defaultProps = {
  renderMediaLibraryMetadata: false
};

export default ResourcePreviewScreen;

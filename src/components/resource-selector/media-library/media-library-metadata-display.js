import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../locale-context.js';
import { useService } from '../../container-context.js';
import LanguageDataProvider from '../../../localization/language-data-provider.js';

function MediaLibraryMetadataDisplay({ mediaLibraryItem }) {
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('mediaLibraryMetadataDisplay');
  const languageDataProvider = useService(LanguageDataProvider);

  const renderLanguages = () => {
    return mediaLibraryItem.languages.map(language => {
      const { name } = languageDataProvider.getLanguageData(language, uiLanguage);
      return name;
    }).join(', ');
  };

  const renderMissingData = () => <i>{t('missingDataPlaceholder')}</i>;

  const renderAllRightsReserved = () => <i>{t('common:allRightsReserved')}</i>;

  return (
    <div className="MediaLibraryMetadataDisplay">
      <div>
        <b>{t('common:shortDescription')}</b>
        <div>{mediaLibraryItem.shortDescription || renderMissingData()}</div>
      </div>
      <div>
        <b>{t('common:languages')}</b>
        <div>{renderLanguages() || renderMissingData()}</div>
      </div>
      <div>
        <b>{t('common:licenses')}</b>
        <div>{mediaLibraryItem.allRightsReserved ? renderAllRightsReserved() : mediaLibraryItem.licenses.join(', ')}</div>
      </div>
      <div>
        <b>{t('common:tags')}</b>
        <div>{mediaLibraryItem.tags.join(', ')}</div>
      </div>
    </div>
  );
}

MediaLibraryMetadataDisplay.propTypes = {
  mediaLibraryItem: PropTypes.shape({
    url: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    shortDescription: PropTypes.string.isRequired,
    languages: PropTypes.arrayOf(PropTypes.string).isRequired,
    allRightsReserved: PropTypes.bool.isRequired,
    licenses: PropTypes.arrayOf(PropTypes.string).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired
};

export default MediaLibraryMetadataDisplay;

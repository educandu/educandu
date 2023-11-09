import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useLocale } from '../locale-context.js';
import DocumentSelector from '../document-selector.js';
import LanguageIcon from '../localization/language-icon.js';
import { settingsDocumentShape } from '../../ui/default-prop-types.js';

const settingsToDisplayList = (supportedUiLanguages, settings = {}) => {
  return supportedUiLanguages.map(uiLanguage => {
    const setting = settings[uiLanguage];
    return {
      key: uiLanguage,
      language: uiLanguage,
      documentId: setting?.documentId || ''
    };
  });
};

const displayListToSettings = pageList => {
  return pageList.reduce((map, item) => {
    map[item.language] = {
      documentId: item.documentId
    };
    return map;
  }, {});
};

function DashboardHelpLinksSettings({ settings, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleDocumentIdChange = (language, value) => {
    const displayList = settingsToDisplayList(supportedUiLanguages, settings);
    const updatedDisplayList = displayList.map(item => item.language === language ? { ...item, documentId: value } : item);
    onChange(displayListToSettings(updatedDisplayList));
  };

  const displayList = settingsToDisplayList(supportedUiLanguages, settings);

  return (
    <div className="DashboardHelpLinksSettings">
      {displayList.map(item => (
        <div key={item.key} className="DashboardHelpLinksSettings-languageRow">
          <LanguageIcon language={item.language} />
          <DocumentSelector
            documentId={item.documentId}
            onChange={value => handleDocumentIdChange(item.language, value)}
            />
        </div>
      ))}
    </div>
  );
}

DashboardHelpLinksSettings.propTypes = {
  onChange: PropTypes.func.isRequired,
  settings: PropTypes.objectOf(settingsDocumentShape)
};

DashboardHelpLinksSettings.defaultProps = {
  settings: {}
};

export default memo(DashboardHelpLinksSettings);

import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useLocale } from '../locale-context.js';
import LanguageIcon from '../localization/language-icon.js';
import SettingsDocumentsTable from './settings-documents-table.js';
import { settingsDocumentShape } from '../../ui/default-prop-types.js';

function FooterLinksSettings({ footerLinks, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleChange = (lang, items) => {
    const updatedFooterLinks = supportedUiLanguages.reduce((map, sl) => {
      map[sl] = sl !== lang ? footerLinks?.[sl] || [] : items;
      return map;
    }, {});
    onChange(updatedFooterLinks);
  };

  return (
    <div>
      {supportedUiLanguages.map((uiLanguageCode, index) => (
        <React.Fragment key={uiLanguageCode}>
          {index !== 0 && <br />}
          <h3>
            <LanguageIcon language={uiLanguageCode} />
          </h3>
          <SettingsDocumentsTable
            settingsDocuments={footerLinks?.[uiLanguageCode] || []}
            onChange={items => handleChange(uiLanguageCode, items)}
            />
        </React.Fragment>
      ))}
    </div>
  );
}

FooterLinksSettings.propTypes = {
  footerLinks: PropTypes.objectOf(PropTypes.arrayOf(settingsDocumentShape)),
  onChange: PropTypes.func.isRequired
};

FooterLinksSettings.defaultProps = {
  footerLinks: {}
};

export default memo(FooterLinksSettings);

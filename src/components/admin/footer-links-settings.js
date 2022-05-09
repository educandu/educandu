import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useLocale } from '../locale-context.js';
import SettingsDocumentsTable from './settings-documents-table.js';
import { settingsDocumentShape } from '../../ui/default-prop-types.js';
import LanguageFlagAndName from '../localization/language-flag-and-name.js';

const hasValue = value => value && String(value).trim();

const isValidFooterLinkItem = item => [item.linkTitle, item.documentKey].every(hasValue);

function FooterLinksSettings({ footerLinks, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleChange = (lang, items) => {
    const updatedFooterLinks = supportedUiLanguages.reduce((map, sl) => {
      map[sl] = sl !== lang ? footerLinks?.[sl] || [] : items;
      return map;
    }, {});
    const isInvalid = Object.values(updatedFooterLinks).some(fl => {
      return fl.some(item => !isValidFooterLinkItem(item));
    });
    onChange(updatedFooterLinks, { isValid: !isInvalid });
  };

  return (
    <div>
      {supportedUiLanguages.map((lang, idx) => (
        <React.Fragment key={lang}>
          {idx !== 0 && <br />}
          <h3>
            <LanguageFlagAndName language={lang} />
          </h3>
          <SettingsDocumentsTable
            settingsDocuments={footerLinks?.[lang] || []}
            onChange={items => handleChange(lang, items)}
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

import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { useLanguage } from '../language-context.js';
import SettingsDocumentsTable from './settings-documents-table.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { documentMetadataShape, documentRevisionShape, documentShape, settingsDocumentShape } from '../../ui/default-prop-types.js';

const hasValue = value => value && String(value).trim();

const isValidFooterLinkItem = item => [item.linkTitle, item.documentNamespace, item.documentSlug].every(hasValue);

function FooterLinksSettings({ footerLinks, documents, onChange }) {
  const { t } = useTranslation('footerLinksSettings');
  const { language, supportedLanguages } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);

  const languageNames = languageNameProvider.getData(language);

  const handleChange = (lang, items) => {
    const updatedFooterLinks = supportedLanguages.reduce((map, sl) => {
      map[sl] = sl !== lang ? footerLinks[sl] || [] : items;
      return map;
    }, {});
    const isInvalid = Object.values(updatedFooterLinks).some(fl => {
      return fl.some(item => !isValidFooterLinkItem(item));
    });
    onChange(updatedFooterLinks, { isValid: !isInvalid });
  };

  return (
    <div>
      {supportedLanguages.map((lang, idx) => (
        <React.Fragment key={lang}>
          {idx !== 0 && <br />}
          <h3>
            <CountryFlagAndName
              code={languageNames[lang]?.flag}
              name={languageNames[lang]?.name || t('unknown')}
              />
          </h3>
          <SettingsDocumentsTable
            documents={documents}
            settingsDocuments={footerLinks[lang] || []}
            onChange={items => handleChange(lang, items)}
            />
        </React.Fragment>
      ))}
    </div>
  );
}

FooterLinksSettings.propTypes = {
  documents: PropTypes.arrayOf(PropTypes.oneOfType([
    documentMetadataShape,
    documentRevisionShape,
    documentShape
  ])).isRequired,
  footerLinks: PropTypes.objectOf(PropTypes.arrayOf(settingsDocumentShape)).isRequired,
  onChange: PropTypes.func.isRequired
};

export default memo(FooterLinksSettings);

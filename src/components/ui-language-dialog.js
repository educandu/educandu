import PropTypes from 'prop-types';
import { Modal, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useService } from './container-context.js';
import { useLanguage } from './language-context.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';

function createLanguagesToChoose(languageNameProvider, supportedLanguages, language) {
  const data = languageNameProvider.getData(language);
  return supportedLanguages.map(lang => ({ ...data[lang], code: lang }));
}

function UiLanguageDialog({ visible, onClose }) {
  const { t, i18n } = useTranslation('uiLanguageDialog');
  const { supportedLanguages, language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [languagesToChoose, setLanguagesToChoose] = useState(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));

  useEffect(() => {
    setLanguagesToChoose(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));
  }, [languageNameProvider, supportedLanguages, language]);

  const handleOk = () => {
    i18n.changeLanguage(selectedLanguage);
    onClose?.();
  };

  const handleCancel = () => onClose?.();

  const handleLanguageChange = event => {
    setSelectedLanguage(event.target.value);
  };

  return (
    <Modal visible={visible} onOk={handleOk} onCancel={handleCancel} title={t('title')}>
      <div className="UiLanguageDialog-explanation">{t('explanation')}</div>
      <Radio.Group className="UiLanguageDialog-languageSwitch" value={selectedLanguage} onChange={handleLanguageChange}>
        {languagesToChoose.map(lang => (
          <div key={lang.code}>
            <Radio.Button className="UiLanguageDialog-languageButton" value={lang.code}>
              <div className="UiLanguageDialog-languageButtonContent">
                <CountryFlagAndName code={lang.flag} name={lang.name} stacked />
              </div>
            </Radio.Button>
          </div>
        ))}
      </Radio.Group>
    </Modal>
  );
}

UiLanguageDialog.propTypes = {
  onClose: PropTypes.func,
  visible: PropTypes.bool
};

UiLanguageDialog.defaultProps = {
  onClose: () => {},
  visible: false
};

export default UiLanguageDialog;

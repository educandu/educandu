import PropTypes from 'prop-types';
import { Modal, Radio } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import LanguageFlagAndName from './localization/language-flag-and-name.js';

function UiLanguageDialog({ visible, onClose }) {
  const { t, i18n } = useTranslation('uiLanguageDialog');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const [selectedLanguage, setSelectedLanguage] = useState(uiLanguage);

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
        {supportedUiLanguages.map(lang => (
          <div key={lang}>
            <Radio.Button className="UiLanguageDialog-languageButton" value={lang}>
              <div className="UiLanguageDialog-languageButtonContent">
                <LanguageFlagAndName language={lang} stacked />
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

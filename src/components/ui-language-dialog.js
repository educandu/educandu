import { Modal } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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

  const handleLanguageChange = language => {
    setSelectedLanguage(language);
  };

  return (
    <Modal visible={visible} onOk={handleOk} onCancel={handleCancel} title={t('title')}>
      <div className="UiLanguageDialog-explanation">{t('explanation')}</div>
      <div className="UiLanguageDialog-languages">
        {supportedUiLanguages.map(language => (
          <div
            key={language}
            onClick={() => handleLanguageChange(language)}
            className={classNames('UiLanguageDialog-language', { 'is-selected': selectedLanguage === language })}
            >
            <LanguageFlagAndName language={language} stacked />
          </div>
        ))}
      </div>
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

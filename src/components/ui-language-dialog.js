import { Modal } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import LanguageFlagAndName from './localization/language-flag-and-name.js';

function UiLanguageDialog({ isOpen, onClose }) {
  const { t, i18n } = useTranslation('uiLanguageDialog');
  const { supportedUiLanguages, uiLanguage } = useLocale();
  const [selectedLanguage, setSelectedLanguage] = useState(uiLanguage);

  const handleOk = () => {
    i18n.changeLanguage(selectedLanguage);
    onClose?.();
  };

  const handleCancel = () => onClose?.();

  const handleLanguageChange = (language, close) => {
    setSelectedLanguage(language);
    if (close) {
      handleOk();
    }
  };

  return (
    <Modal open={isOpen} onOk={handleOk} onCancel={handleCancel} title={t('title')}>
      <div className="u-modal-body">
        <div className="UiLanguageDialog-explanation">{t('explanation')}</div>
        <div className="UiLanguageDialog-languages">
          {supportedUiLanguages.map(language => (
            <div
              key={language}
              onClick={() => handleLanguageChange(language, false)}
              onDoubleClick={() => handleLanguageChange(language, true)}
              className={classNames('UiLanguageDialog-language', { 'is-selected': selectedLanguage === language })}
              >
              <LanguageFlagAndName language={language} stacked />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

UiLanguageDialog.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

UiLanguageDialog.defaultProps = {
  isOpen: false,
  onClose: () => {}
};

export default UiLanguageDialog;

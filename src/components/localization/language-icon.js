import React from 'react';
import { Tooltip } from 'antd';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import { useService } from '../container-context.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';

export default function LanguageIcon({ language }) {
  const { uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);
  const { name: languageName } = languageDataProvider.getLanguageData(language, uiLanguage);

  return (
    <Tooltip title={languageName}>
      <div className="LanguageIcon">{language.toUpperCase()}</div>
    </Tooltip>
  );
}

LanguageIcon.propTypes = {
  language: PropTypes.string.isRequired
};

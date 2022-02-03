import React from 'react';
import PropTypes from 'prop-types';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';

export default function LanguageFlagAndName({ language, flagOnly, stacked }) {
  const { uiLanguage } = useLocale();
  const languageNameProvider = useService(LanguageNameProvider);
  const languageData = languageNameProvider.getData(uiLanguage);
  return (
    <CountryFlagAndName
      code={languageData[language]?.flag}
      name={languageData[language]?.name || language}
      flagOnly={flagOnly}
      stacked={stacked}
      />
  );
}

LanguageFlagAndName.propTypes = {
  flagOnly: PropTypes.bool,
  language: PropTypes.string.isRequired,
  stacked: PropTypes.bool
};

LanguageFlagAndName.defaultProps = {
  flagOnly: false,
  stacked: false
};

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useLocale } from '../locale-context.js';
import { useService } from '../container-context.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';

const FLAG_ICONS_LIBRARY_MAIN_CLASS = 'fi';

export default function LanguageFlagAndName({ language, stacked }) {
  const { uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);
  const { name, flag } = languageDataProvider.getLanguageData(language, uiLanguage);

  const mainClasses = classNames({
    'LanguageFlagAndName': true,
    'LanguageFlagAndName--stacked': stacked
  });

  const flagClasses = classNames(
    'LanguageFlagAndName-flag',
    FLAG_ICONS_LIBRARY_MAIN_CLASS,
    `${FLAG_ICONS_LIBRARY_MAIN_CLASS}-${flag.toLowerCase()}`
  );

  return (
    <span className={mainClasses}>
      <span className={flagClasses} title={name} />
      <span className="LanguageFlagAndName-name">&nbsp;&nbsp;{name}</span>
    </span>
  );
}

LanguageFlagAndName.propTypes = {
  language: PropTypes.string.isRequired,
  stacked: PropTypes.bool
};

LanguageFlagAndName.defaultProps = {
  stacked: false
};

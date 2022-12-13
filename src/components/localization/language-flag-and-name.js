import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useLocale } from '../locale-context.js';
import { useService } from '../container-context.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';

export default function LanguageFlagAndName({ language, stacked }) {
  const { uiLanguage } = useLocale();
  const languageDataProvider = useService(LanguageDataProvider);
  const { name, flag } = languageDataProvider.getLanguageData(language, uiLanguage);

  const classes = classNames({
    'LanguageFlagAndName': true,
    'LanguageFlagAndName--stacked': stacked
  });

  return (
    <span className={classes}>
      <span className={`LanguageFlagAndName-flag flag-icon flag-icon-${flag.toLowerCase()}`} title={name} />
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

import React from 'react';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LanguageFlagAndName from '../localization/language-flag-and-name.js';

function ConsentSettings({ consentText, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleConsentTextChanged = (lang, value) => {
    const updatedConsentText = cloneDeep(consentText);
    updatedConsentText[lang] = value;
    onChange(updatedConsentText, { isValid: !!value.trim().length });
  };

  return (
    <div>
      {supportedUiLanguages.map((lang, idx) => (
        <React.Fragment key={lang}>
          {idx !== 0 && <br />}
          <h3>
            <LanguageFlagAndName language={lang} />
          </h3>
          <MarkdownInput
            preview
            value={consentText?.[lang] || ''}
            onChange={event => handleConsentTextChanged(lang, event.target.value)}
            />
        </React.Fragment>
      ))}
    </div>
  );
}

ConsentSettings.propTypes = {
  consentText: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

ConsentSettings.defaultProps = {
  consentText: {}
};

export default ConsentSettings;

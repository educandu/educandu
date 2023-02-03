import React from 'react';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LanguageFlagAndName from '../localization/language-flag-and-name.js';

function MarkdownSettingInSupportedLanguages({ settingValue, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleSettingTextChanged = (lang, value) => {
    const updatedSettingValue = cloneDeep(settingValue);
    updatedSettingValue[lang] = value;
    onChange(updatedSettingValue);
  };

  return (
    <div>
      {supportedUiLanguages.map((lang, idx) => (
        <React.Fragment key={lang}>
          {idx !== 0 && <br />}
          <h5>
            <LanguageFlagAndName language={lang} />
          </h5>
          <MarkdownInput
            preview
            value={settingValue?.[lang] || ''}
            onChange={event => handleSettingTextChanged(lang, event.target.value)}
            />
        </React.Fragment>
      ))}
    </div>
  );
}

MarkdownSettingInSupportedLanguages.propTypes = {
  onChange: PropTypes.func.isRequired,
  settingValue: PropTypes.objectOf(PropTypes.string)
};

MarkdownSettingInSupportedLanguages.defaultProps = {
  settingValue: {}
};

export default MarkdownSettingInSupportedLanguages;

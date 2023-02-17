import React from 'react';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import MarkdownInput from '../markdown-input.js';
import cloneDeep from '../../utils/clone-deep.js';
import LanguageIcon from '../localization/language-icon.js';

function MarkdownSettingInSupportedLanguages({ settingValue, onChange }) {
  const { supportedUiLanguages } = useLocale();

  const handleSettingTextChanged = (lang, value) => {
    const updatedSettingValue = cloneDeep(settingValue);
    updatedSettingValue[lang] = value;
    onChange(updatedSettingValue);
  };

  return (
    <div>
      {supportedUiLanguages.map((uiLanguageCode, index) => (
        <React.Fragment key={uiLanguageCode}>
          {index !== 0 && <br />}
          <h5>
            <LanguageIcon language={uiLanguageCode} />
          </h5>
          <MarkdownInput
            preview
            value={settingValue?.[uiLanguageCode] || ''}
            onChange={event => handleSettingTextChanged(uiLanguageCode, event.target.value)}
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

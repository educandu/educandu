import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import LanguageFlagAndName from '../language-flag-and-name.js';
import LanguageNameProvider from '../../data/language-name-provider.js';

const Option = Select.Option;

function createLanguageList(languageNameProvider, language, languages) {
  const data = languageNameProvider.getData(language);
  return Object.entries(data)
    .filter(([key]) => !languages || languages.includes(key))
    .map(([key, value]) => ({
      code: key,
      name: value.name
    }))
    .sort(by(x => x.name));
}

function LanguageSelect({ size, value, languages, onChange }) {
  const { uiLanguage } = useLocale();
  const languageNameProvider = useService(LanguageNameProvider);
  const [languageList, setLanguageList] = useState(createLanguageList(languageNameProvider, uiLanguage, languages));
  useEffect(() => {
    setLanguageList(createLanguageList(languageNameProvider, uiLanguage, languages));
  }, [languageNameProvider, uiLanguage, languages]);

  return (
    <Select
      size={size}
      value={value}
      onChange={onChange}
      optionFilterProp="title"
      style={{ width: '100%' }}
      showSearch
      autoComplete="none"
      >
      {languageList.map(ln => (
        <Option key={ln.code} value={ln.code} title={ln.name}>
          <LanguageFlagAndName language={ln.code} />
        </Option>
      ))}
    </Select>
  );
}

LanguageSelect.propTypes = {
  languages: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  value: PropTypes.string
};

LanguageSelect.defaultProps = {
  languages: null,
  onChange: () => 'underlying binding done through ant design form',
  size: 'middle',
  value: 'underlying binding done through ant design form'
};

export default LanguageSelect;

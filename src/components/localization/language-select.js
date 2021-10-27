import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useService } from '../container-context.js';
import { useLanguage } from '../language-context.js';
import React, { useState, useEffect } from 'react';
import CountryFlagAndName from './country-flag-and-name.js';
import LanguageNameProvider from '../../data/language-name-provider.js';

const Option = Select.Option;

function createLanguageList(languageNameProvider, language, languages) {
  const data = languageNameProvider.getData(language);
  return Object.entries(data)
    .filter(([key]) => !languages || languages.includes(key))
    .map(([key, value]) => ({
      code: key,
      name: value.name,
      flag: value.flag
    }))
    .sort(by(x => x.name));
}

function LanguageSelect({ size, value, languages, onChange }) {
  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [languageList, setLanguageList] = useState(createLanguageList(languageNameProvider, language, languages));
  useEffect(() => {
    setLanguageList(createLanguageList(languageNameProvider, language, languages));
  }, [languageNameProvider, language, languages]);

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
          <CountryFlagAndName code={ln.flag} name={ln.name} />
        </Option>
      ))}
    </Select>
  );
}

LanguageSelect.propTypes = {
  languages: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  value: PropTypes.string.isRequired
};

LanguageSelect.defaultProps = {
  languages: null,
  size: 'middle'
};

export default LanguageSelect;

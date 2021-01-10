import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useService } from './container-context';
import { useLanguage } from './language-context';
import React, { useState, useEffect } from 'react';
import CountryFlagAndName from './country-flag-and-name';
import LanguageNameProvider from '../data/language-name-provider';

const Option = Select.Option;

function createLanguageList(languageNameProvider, language) {
  const data = languageNameProvider.getData(language);
  return Object.entries(data).map(([key, value]) => ({
    code: key,
    name: value.name,
    flag: value.flag
  })).sort(by(x => x.name));
}

function LanguageSelect({ value, onChange }) {
  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [languageList, setLanguageList] = useState(createLanguageList(languageNameProvider, language));
  useEffect(() => {
    setLanguageList(createLanguageList(languageNameProvider, language));
  }, [languageNameProvider, language]);

  return (
    <Select value={value} onChange={onChange} optionFilterProp="title" style={{ width: '100%' }} showSearch>
      {languageList.map(ln => (
        <Option key={ln.code} value={ln.code} title={ln.name}>
          <CountryFlagAndName code={ln.flag} name={ln.name} />
        </Option>
      ))}
    </Select>
  );
}

LanguageSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};

export default LanguageSelect;

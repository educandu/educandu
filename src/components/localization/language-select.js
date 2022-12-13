import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';

const Option = Select.Option;

function LanguageSelect({ size, value, languages, onChange }) {
  const { uiLanguage } = useLocale();
  const [languageList, setLanguageList] = useState([]);
  const languageDataProvider = useService(LanguageDataProvider);

  useEffect(() => {
    const allData = languageDataProvider.getAllLanguageData(uiLanguage);
    const relevantLanguages = Object.values(allData)
      .filter(({ code }) => !languages || languages.includes(code))
      .sort(by(x => x.name, { ignoreCase: true }));

    setLanguageList(relevantLanguages);
  }, [languageDataProvider, uiLanguage, languages]);

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
          <span>{ln.name} ({ln.code})</span>
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

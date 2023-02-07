import by from 'thenby';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import { useLocale } from '../locale-context.js';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import LanguageDataProvider from '../../localization/language-data-provider.js';

const Option = Select.Option;

function LanguageSelect({ multi, languages, ...rest }) {
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
      showSearch
      autoComplete="none"
      optionFilterProp="title"
      style={{ width: '100%' }}
      mode={multi ? 'multiple' : null}
      {...rest}
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
  multi: PropTypes.bool
};

LanguageSelect.defaultProps = {
  languages: null,
  multi: false
};

export default LanguageSelect;

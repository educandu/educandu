import PropTypes from 'prop-types';
import { Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

export default function SearchBar({ initialValue, autoFocus, onSearch }) {
  const inputRef = useRef();
  const { t } = useTranslation('searchBar');
  const [searchText, setSearchText] = useState(initialValue);

  const handleSearchInputChange = event => {
    setSearchText(event.target.value);
  };

  const handleSearch = value => {
    if (!value.length) {
      Modal.error({
        title: t('common:error'),
        content: t('common:searchTextTooShort', { minCharCount: 1 }),
        onOk: () => inputRef.current.focus()
      });
    } else {
      onSearch(value);
    }
  };

  return (
    <div className="SearchBar">
      <Search
        size="large"
        ref={inputRef}
        placeholder={t('searchPlaceholder')}
        value={searchText}
        onSearch={handleSearch}
        onChange={handleSearchInputChange}
        enterButton={<SearchOutlined />}
        autoFocus={autoFocus}
        />
    </div>
  );
}

SearchBar.propTypes = {
  autoFocus: PropTypes.bool,
  initialValue: PropTypes.string,
  onSearch: PropTypes.func.isRequired
};

SearchBar.defaultProps = {
  autoFocus: false,
  initialValue: ''
};

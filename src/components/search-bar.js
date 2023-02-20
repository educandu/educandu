import { Input } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { SearchOutlined } from '@ant-design/icons';

export default function SearchBar({ initialValue, autoFocus, onSearch, ...params }) {
  const inputRef = useRef();
  const { t } = useTranslation('searchBar');
  const [searchText, setSearchText] = useState(initialValue);

  const handleSearchInputChange = event => {
    setSearchText(event.target.value);
  };

  const handleSearch = () => {
    if (searchText) {
      onSearch(searchText);
    }
  };

  return (
    <div className="SearchBar">
      <Input
        size="large"
        ref={inputRef}
        placeholder={t('searchPlaceholder')}
        value={searchText}
        onPressEnter={handleSearch}
        onChange={handleSearchInputChange}
        autoFocus={autoFocus}
        suffix={<div className="SearchBar-suffix"><SearchOutlined /></div>}
        {...params}
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

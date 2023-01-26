import PropTypes from 'prop-types';
import { Button, Input } from 'antd';
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
    // Guard agains search by ENTER key
    if (value) {
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
        enterButton={
          <Button type="primary" disabled={!searchText}>
            <SearchOutlined />
          </Button>
        }
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

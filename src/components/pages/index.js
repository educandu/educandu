import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';

function Index({ HomePageTemplate, initialState }) {
  const { t } = useTranslation('index');

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl(searchText.trim());
  };

  const handleTagClick = tag => {
    window.location = routes.getSearchUrl(tag);
  };

  const renderTag = tag => {
    return (
      <div key={tag}>
        <Tag className="Tag Tag--clickable" onClick={() => handleTagClick(tag)}>{tag}</Tag>
      </div>
    );
  };

  return (
    <HomePageTemplate>
      <div className="IndexPage">
        <SearchBar onSearch={handleSearch} autoFocus />
        <div className="IndexPage-popularSearches">
          <div className="IndexPage-popularSearchesLabel">{t('popularSearches')}:</div>
          {initialState.tags.map(renderTag)}
        </div>
      </div>
    </HomePageTemplate>
  );
}

Index.propTypes = {
  HomePageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    tags: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};

export default Index;

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
      <div key={tag} className="IndexPage-searchesTag">
        <Tag className="Tag Tag--clickable" onClick={() => handleTagClick(tag)}>{tag}</Tag>
      </div>
    );
  };

  return (
    <HomePageTemplate>
      <div className="IndexPage">
        <SearchBar onSearch={handleSearch} autoFocus />
        {!!initialState.tags?.length && (
          <div className="IndexPage-searchesWrapper">
            <div className="IndexPage-searchesLabel">{t('recommendedSearches')}:</div>
            <div className="IndexPage-searches">
              {initialState.tags.map(renderTag)}
            </div>
          </div>
        )}
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

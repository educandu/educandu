import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';

function Index({ HomePageTemplate }) {
  const { t } = useTranslation('index');

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl(searchText.trim());
  };

  const handleTagClick = tag => {
    window.location = routes.getSearchUrl('musik');
  };

  return (
    <HomePageTemplate>
      <div className="IndexPage">
        <SearchBar onSearch={handleSearch} autoFocus />
        <div className="IndexPage-popularSearches">
          <div className="IndexPage-popularSearchesLabel">{t('popularSearches')}:</div>
          <div><Tag className="Tag Tag--clickable" onClick={handleTagClick}>Musik</Tag></div>
          <div><Tag className="Tag Tag--clickable" onClick={handleTagClick}>Hochschule</Tag></div>
          <div><Tag className="Tag Tag--clickable" onClick={handleTagClick}>Munchen</Tag></div>
        </div>
      </div>
    </HomePageTemplate>
  );
}

Index.propTypes = {
  HomePageTemplate: PropTypes.func.isRequired
};

export default Index;

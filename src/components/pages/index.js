import React from 'react';
import PropTypes from 'prop-types';
import urls from '../../utils/routes.js';
import SearchBar from '../search-bar.js';

function Index({ HomePageTemplate }) {
  const handleSearch = searchText => {
    window.location = urls.getSearchUrl(searchText.trim());
  };

  return (
    <HomePageTemplate>
      <div className="IndexPage">
        <SearchBar onSearch={handleSearch} autoFocus />
      </div>
    </HomePageTemplate>
  );
}

Index.propTypes = {
  HomePageTemplate: PropTypes.func.isRequired
};

export default Index;

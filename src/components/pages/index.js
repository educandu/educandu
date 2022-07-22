import React from 'react';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';

function Index({ HomePageTemplate }) {
  const handleSearch = searchText => {
    window.location = routes.getSearchUrl(searchText.trim());
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

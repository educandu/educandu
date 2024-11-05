import React from 'react';
import { Tag } from 'antd';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';

function Index({ HomePageTemplate, initialState }) {
  const { t } = useTranslation('index');
  const { tags, documentsCount, mediaItemsCount } = initialState;

  const handleSearch = searchText => {
    window.location = routes.getSearchUrl({ query: searchText });
  };

  const handleTagClick = tag => {
    window.location = routes.getSearchUrl({ query: tag });
  };

  const renderTag = tag => {
    return (
      <div key={tag} className="IndexPage-searchesTag">
        <Tag className="Tag Tag--clickableInverted" onClick={() => handleTagClick(tag)}>{tag}</Tag>
      </div>
    );
  };

  return (
    <HomePageTemplate>
      <div className="IndexPage">
        <SearchBar onSearch={handleSearch} autoFocus />
        {!!documentsCount && !!mediaItemsCount && (
          <div className="IndexPage-infoText">
            {t('infoText', { documentsCount, mediaItemsCount })}
          </div>
        )}
        {!!tags?.length && (
          <div className="IndexPage-searchesWrapper">
            <div className="IndexPage-searchesLabel">{t('recommendedSearches')}:</div>
            <div className="IndexPage-searches">
              {tags.map(renderTag)}
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
    tags: PropTypes.arrayOf(PropTypes.string),
    documentsCount: PropTypes.number,
    mediaItemsCount: PropTypes.number
  }).isRequired
};

export default Index;

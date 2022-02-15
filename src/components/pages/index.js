import React from 'react';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import urls from '../../utils/urls.js';
import SearchBar from '../search-bar.js';
import { useSettings } from '../settings-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';

function Index({ PageTemplate, HomePageLogo, SiteLogo }) {
  const settings = useSettings();

  const handleSearch = searchText => {
    window.location = urls.getSearchUrl(searchText);
  };

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          {HomePageLogo ? <HomePageLogo /> : <SiteLogo readonly />}
        </div>
        <div className="IndexPage-search">
          <SearchBar onSearch={handleSearch} autoFocus />
        </div>
        {settings.homepageInfo && (
          <div className="IndexPage-homepageInfo">
            <Markdown renderMedia>{settings.homepageInfo}</Markdown>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

Index.propTypes = {
  HomePageLogo: PropTypes.func,
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

Index.defaultProps = {
  HomePageLogo: null
};

export default Index;

import PropTypes from 'prop-types';
import { Button, Input } from 'antd';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalAlerts } from '../../ui/global-alerts.js';

function Index({ PageTemplate, SiteLogo }) {
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation('index');

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    window.location = urls.getSearchUrl(searchText.trim());
  };

  const handleSearchTextChanged = event => {
    setSearchText(event.target.value);
  };

  const handleSearchInputKeyUp = e => {
    if (!isSearching && e.key === 'Enter' && searchText.trim().length > 2) {
      handleSearch();
    }
  };

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <SiteLogo readonly />
        </div>
        <div className="IndexPage-search">
          <Input
            size="large"
            className="IndexPage-searchInput"
            placeholder={t('searchInputPlaceholder')}
            autoFocus
            value={searchText}
            onKeyUp={handleSearchInputKeyUp}
            onChange={handleSearchTextChanged}
            />
          <Button
            size="large"
            onClick={handleSearch}
            type="primary"
            loading={isSearching}
            disabled={!searchText || searchText.trim().length < 3}
            className="IndexPage-searchButton"
            >
            {t('searchButton')}
          </Button>
        </div>
      </div>
    </PageTemplate>
  );
}

Index.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Index;

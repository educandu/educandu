import Page from '../page.js';
import PropTypes from 'prop-types';
import DocView from '../doc-view.js';
import { Button, Input } from 'antd';
import SiteLogo from '../site-logo.js';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from '../container-context.js';
import { useLanguage } from '../language-context.js';
import { getHomeUrl, getSearchUrl } from '../../utils/urls.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { documentShape, homeLanguageShape } from '../../ui/default-prop-types.js';

function Index({ initialState }) {
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation('index');

  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const { document: doc, homeLanguages, currentHomeLanguageIndex } = initialState;
  const currentHomeLanguage = homeLanguages[currentHomeLanguageIndex];
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    window.location = getSearchUrl(searchText.trim());
  };

  const handleSearchTextChanged = event => {
    setSearchText(event.target.value);
  };

  const handleSearchInputKeyUp = e => {
    if (!isSearching && e.key === 'Enter' && searchText.trim().length > 2) {
      handleSearch();
    }
  };

  const languageNames = languageNameProvider.getData(language);

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <SiteLogo size="big" readonly />
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
        {currentHomeLanguage && (
          <div className="IndexPage-languageLinks">
            {homeLanguages.map((hl, index) => (
              <Button key={index.toString()} type="link" href={getHomeUrl(index === 0 ? null : hl.language)}>
                <CountryFlagAndName
                  code={languageNames[hl.language]?.flag || null}
                  name={languageNames[hl.language]?.name || null}
                  flagOnly
                  />
              </Button>
            ))}
          </div>
        )}
        {doc && <DocView documentOrRevision={doc} />}
      </div>
    </Page>
  );
}

Index.propTypes = {
  initialState: PropTypes.shape({
    document: documentShape,
    homeLanguages: PropTypes.arrayOf(homeLanguageShape).isRequired,
    currentHomeLanguageIndex: PropTypes.number.isRequired
  }).isRequired
};

export default Index;

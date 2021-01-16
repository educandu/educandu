import React from 'react';
import Page from '../page';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import { Button, Input } from 'antd';
import { useRequest } from '../request-context';
import { useService } from '../container-context';
import { useLanguage } from '../language-context';
import LanguageNameProvider from '../../data/language-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { documentShape, homeLanguageShape } from '../../ui/default-prop-types';

const { Search } = Input;

function Index({ initialState }) {
  const req = useRequest();
  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const { document: doc, homeLanguages, currentHomeLanguageIndex } = initialState;
  const currentHomeLanguage = homeLanguages[currentHomeLanguageIndex];

  const handleSearchClick = searchTerm => {
    const googleTerm = [`site:${req.hostInfo.host}`, searchTerm].filter(x => x).join(' ');
    const link = `https://www.google.com/search?q=${encodeURIComponent(googleTerm)}`;
    window.open(link, '_blank');
  };

  const languageNames = languageNameProvider.getData(language);

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="IndexPage-languageLinks">
          {homeLanguages.map((hl, index) => (
            <Button key={index.toString()} type="link" href={urls.getHomeUrl(index === 0 ? null : hl.language)}>
              <CountryFlagAndName
                code={languageNames[hl.language]?.flag || null}
                name={languageNames[hl.language]?.name || null}
                flagOnly
                />
            </Button>
          ))}
        </div>
        {currentHomeLanguage && (
          <div className="IndexPage-search">
            <Search
              placeholder={currentHomeLanguage.searchFieldPlaceholder}
              enterButton={currentHomeLanguage.searchFieldButton}
              size="large"
              onSearch={handleSearchClick}
              />
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

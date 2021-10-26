import React, { useState, useCallback } from 'react';
import Page from '../page';
import DocView from '../doc-view';
import PropTypes from 'prop-types';
import { getHomeUrl, getSearchPath } from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import { Button, Select } from 'antd';
import { useService, inject } from '../container-context';
import { useLanguage } from '../language-context';
import LanguageNameProvider from '../../data/language-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { documentShape, homeLanguageShape } from '../../ui/default-prop-types';
import DocumentApiClient from '../../services/document-api-client';

function Index({ initialState, documentApiClient }) {
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const { document: doc, homeLanguages, currentHomeLanguageIndex } = initialState;
  const currentHomeLanguage = homeLanguages[currentHomeLanguageIndex];

  const handleSearchClick = tags => {
    window.location = getSearchPath(tags);
  };

  const getTagSuggestions = useCallback(async tagSuggestionsQuery => {
    setTagSuggestions(await documentApiClient.getDocumentTagSuggestions(tagSuggestionsQuery));
  }, [documentApiClient]);

  const languageNames = languageNameProvider.getData(language);

  return (
    <Page fullScreen>
      <div className="IndexPage">
        <div className="IndexPage-title">
          <ElmuLogo size="big" readonly />
        </div>
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
        {currentHomeLanguage && (
          <div className="IndexPage-search">
            <Select
              mode="tags"
              size="large"
              style={{ width: '100%' }}
              tokenSeparators={[' ', '\t']}
              value={selectedTags}
              onSearch={value => {
                if (value.length === 3) {
                  getTagSuggestions(value);
                }
              }}
              onChange={selectedValues => { setSelectedTags(selectedValues); }}
              options={tagSuggestions.map(tag => ({ value: tag, key: tag }))}
              />
            <Button
              size="large"
              onClick={() => handleSearchClick(selectedTags)}
              type="primary"
              >
              {currentHomeLanguage.searchFieldPlaceholder}
            </Button>
          </div>
        )}
        {doc && <DocView documentOrRevision={doc} />}
      </div>
    </Page>
  );
}

Index.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    document: documentShape,
    homeLanguages: PropTypes.arrayOf(homeLanguageShape).isRequired,
    currentHomeLanguageIndex: PropTypes.number.isRequired
  }).isRequired
};

export default inject({
  documentApiClient: DocumentApiClient
}, Index);

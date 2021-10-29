import React, { useState, useCallback } from 'react';
import Page from '../page.js';
import DocView from '../doc-view.js';
import PropTypes from 'prop-types';
import { getHomeUrl, getSearchUrl } from '../../utils/urls.js';
import ElmuLogo from '../elmu-logo.js';
import { Button, Select } from 'antd';
import { useService } from '../container-context.js';
import { useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { documentShape, homeLanguageShape } from '../../ui/default-prop-types.js';
import DocumentApiClient from '../../services/document-api-client.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../settings-context.js';

function Index({ initialState }) {
  const settings = useSettings();

  const [tagSuggestions, setTagSuggestions] = useState(settings.defaultTags || []);
  const [selectedTags, setSelectedTags] = useState([]);
  const documentApiClient = useService(DocumentApiClient);
  const { t } = useTranslation();

  const { language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const { document: doc, homeLanguages, currentHomeLanguageIndex } = initialState;
  const currentHomeLanguage = homeLanguages[currentHomeLanguageIndex];

  const handleSearchClick = tags => {
    window.location = getSearchUrl(tags);
  };

  const getTagSuggestions = useCallback(async tagSuggestionsQuery => {
    if (tagSuggestionsQuery.length !== 3) {
      return;
    }
    try {
      setTagSuggestions(await documentApiClient.getDocumentTagSuggestions(tagSuggestionsQuery));
    } catch (error) {
      handleApiError({ error, t });
    }
  }, [documentApiClient, t]);

  const handleSelectedTagsChanged = selectedValues => {
    setSelectedTags(selectedValues);
    setTagSuggestions(settings.defaultTags || []);
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
              mode="multiple"
              size="large"
              className="IndexPage-searchInput"
              tokenSeparators={[' ']}
              placeholder={currentHomeLanguage.searchFieldPlaceholder}
              value={selectedTags}
              onSearch={getTagSuggestions}
              onChange={handleSelectedTagsChanged}
              options={tagSuggestions.map(tag => ({ value: tag, key: tag }))}
              />
            <Button
              size="large"
              onClick={() => handleSearchClick(selectedTags)}
              type="primary"
              disabled={!selectedTags.length}
              className="IndexPage-searchButton"
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
  initialState: PropTypes.shape({
    document: documentShape,
    homeLanguages: PropTypes.arrayOf(homeLanguageShape).isRequired,
    currentHomeLanguageIndex: PropTypes.number.isRequired
  }).isRequired
};

export default Index;

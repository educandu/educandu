import by from 'thenby';
import { Tag } from 'antd';
import Table from '../table.js';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import SearchBar from '../search-bar.js';
import Logger from '../../common/logger.js';
import TagSelector from '../tag-selector.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
import { useRequest } from '../request-context.js';
import SortingSelector from '../sorting-selector.js';
import CloseIcon from '../icons/general/close-icon.js';
import DocumentInfoCell from '../document-info-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import LanguageIcon from '../localization/language-icon.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const searchApiClient = useSessionAwareApiClient(SearchApiClient);

  const [allTags, setAllTags] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [unselectedTags, setUnselectedTags] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [displayedDocuments, setDisplayedDocuments] = useState([]);
  const [searchText, setSearchText] = useState(request.query.query);
  const [sorting, setSorting] = useState({ value: 'relevance', direction: 'desc' });

  const sortingOptions = [
    { label: t('common:relevance'), appliedLabel: t('common:sortedByRelevance'), value: 'relevance' },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' }
  ];

  const sorters = useMemo(() => ({
    relevance: documentsToSort => documentsToSort.sort(by(doc => doc.tagMatchCount, sorting.direction).thenBy(doc => doc.updatedOn, 'desc')),
    title: documentsToSort => documentsToSort.sort(by(doc => doc.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: documentsToSort => documentsToSort.sort(by(doc => doc.createdOn, sorting.direction)),
    updatedOn: documentsToSort => documentsToSort.sort(by(doc => doc.updatedOn, sorting.direction)),
    language: documentsToSort => documentsToSort.sort(by(doc => doc.language, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        history.replaceState(null, '', urls.getSearchUrl(searchText));
        const { result } = await searchApiClient.search(searchText);
        setDocuments(result);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsSearching(false);
      }
    })();
  }, [searchText, searchApiClient, t]);

  useEffect(() => {
    const documentTags = documents.map(doc => doc.tags).flat().map(tag => tag.toLowerCase());
    setAllTags([...new Set(documentTags)]);
  }, [documents]);

  useEffect(() => {
    setUnselectedTags(allTags.filter(tag => !selectedTags.includes(tag)));
  }, [allTags, selectedTags]);

  useEffect(() => {
    const newDocuments = documents.slice();
    const sorter = sorters[sorting.value];

    const filteredDocuments = newDocuments.filter(doc => selectedTags.every(selectedTag => doc.tags.some(tag => tag.toLowerCase() === selectedTag)));
    const sortedDocuments = sorter ? sorter(filteredDocuments) : filteredDocuments;

    setDisplayedDocuments(sortedDocuments);
  }, [documents, selectedTags, sorting, sorters]);

  const handleSelectTag = tag => setSelectedTags(ensureIsIncluded(selectedTags, tag));
  const handleDeselectTag = tag => setSelectedTags(ensureIsExcluded(selectedTags, tag));
  const handleDeselectTagsClick = () => setSelectedTags([]);
  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const renderTitle = (title, doc) => <DocumentInfoCell doc={doc} />;

  const renderLanguage = lang => (<LanguageIcon language={lang} />);

  const renderCellTags = tags => (
    <div>
      <ItemsExpander
        className="SearchPage-cellTags"
        expandLinkClassName="SearchPage-cellTagsExpandLink"
        items={tags}
        renderItem={tag => <Tag className="Tag" key={tag}>{tag}</Tag>}
        />
    </div>
  );

  const renderSelectedTags = () => selectedTags.map(tag => (
    <Tag
      key={tag}
      closable
      closeIcon={<CloseIcon />}
      className="Tag Tag--selected"
      onClose={() => handleDeselectTag(tag)}
      >
      {tag}
    </Tag>
  ));

  const columns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle
    },
    {
      title: t('common:tags'),
      dataIndex: 'tags',
      render: renderCellTags,
      responsive: ['md'],
      width: '45%'
    },
    {
      title: t('common:language'),
      dataIndex: 'language',
      render: renderLanguage
    }
  ];

  return (
    <PageTemplate>
      <div className="SearchPage">
        <div className="SearchPage-headline">
          <h1>{t('headline', { count: displayedDocuments.length })}</h1>
        </div>
        <div className="SearchPage-controls">
          <SearchBar initialValue={searchText} onSearch={setSearchText} />
          <SortingSelector
            size="large"
            sorting={sorting}
            options={sortingOptions}
            onChange={handleSortingChange}
            />
        </div>
        <div className="SearchPage-selectedTags">
          {renderSelectedTags()}
          <TagSelector
            size="large"
            tags={unselectedTags}
            onSelect={handleSelectTag}
            selectedCount={selectedTags.length}
            />
          {selectedTags.length > 1 && (
            <a className="SearchPage-deselectTagsLink" onClick={handleDeselectTagsClick}>
              <CloseIcon />
              {t('deselectTags')}
            </a>
          )}
        </div>
        <Table
          dataSource={[...displayedDocuments]}
          columns={columns}
          loading={isSearching}
          pagination
          />
      </div>
    </PageTemplate>
  );
}

Search.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Search;

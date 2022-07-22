import by from 'thenby';
import { Tag } from 'antd';
import Table from '../table.js';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
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
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const searchApiClient = useSessionAwareApiClient(SearchApiClient);

  const [rooms, setRooms] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [unselectedTags, setUnselectedTags] = useState([]);
  const [searchText, setSearchText] = useState(request.query.query);
  const [sorting, setSorting] = useState({ value: 'relevance', direction: 'desc' });

  const mapToRows = useCallback(docs => docs.map(doc => (
    {
      key: doc._id,
      documentId: doc._id,
      relevance: doc.tagMatchCount,
      tags: doc.tags,
      title: doc.title,
      createdOn: doc.createdOn,
      updatedOn: doc.updatedOn,
      language: doc.language
    })), []);

  const sortingOptions = [
    { label: t('common:relevance'), appliedLabel: t('common:sortedByRelevance'), value: 'relevance' },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' }
  ];

  const sorters = useMemo(() => ({
    relevance: rowsToSort => rowsToSort.sort(by(row => row.relevance, sorting.direction).thenBy(row => row.updatedOn, 'desc')),
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, sorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.language, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        const trimmedSearchText = searchText.trim();
        history.replaceState(null, '', routes.getSearchUrl(trimmedSearchText));
        const result = await searchApiClient.search(trimmedSearchText);
        setRooms(result.rooms);
        setDocuments(result.documents);
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
    const newRows = mapToRows(documents.slice());
    const sorter = sorters[sorting.value];

    const filteredDocuments = newRows.filter(row => selectedTags.every(selectedTag => row.tags.some(tag => tag.toLowerCase() === selectedTag)));
    const sortedDocuments = sorter ? sorter(filteredDocuments) : filteredDocuments;

    setDisplayedRows(sortedDocuments);
  }, [documents, selectedTags, sorting, sorters, mapToRows]);

  const handleSelectTag = tag => setSelectedTags(ensureIsIncluded(selectedTags, tag));
  const handleDeselectTag = tag => setSelectedTags(ensureIsExcluded(selectedTags, tag));
  const handleDeselectTagsClick = () => setSelectedTags([]);
  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const renderLanguage = lang => (<LanguageIcon language={lang} />);
  const renderTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    const room = doc.roomId ? rooms.find(r => r._id === doc.roomId) : null;

    return !!doc && <DocumentInfoCell doc={doc} room={room} />;
  };

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

  const showSearchingHeadline = isSearching && documents.length === 0;

  return (
    <PageTemplate>
      <div className="SearchPage">
        <div className="SearchPage-headline">
          {showSearchingHeadline && <h1>{t('headlineSearching')}</h1>}
          {!showSearchingHeadline && <h1>{t('headlineDocumentsFound', { count: displayedRows.length })}</h1>}
        </div>
        <div className="SearchPage-controls">
          <SearchBar initialValue={searchText} onSearch={setSearchText} />
          <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
        </div>
        <div className="SearchPage-selectedTags">
          {renderSelectedTags()}
          <TagSelector size="large" tags={unselectedTags} onSelect={handleSelectTag} selectedCount={selectedTags.length} />
          {selectedTags.length > 1 && (
            <a className="SearchPage-deselectTagsLink" onClick={handleDeselectTagsClick}>
              <CloseIcon />
              {t('deselectTags')}
            </a>
          )}
        </div>
        <Table dataSource={[...displayedRows]} columns={columns} loading={isSearching} pagination />
      </div>
    </PageTemplate>
  );
}

Search.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Search;

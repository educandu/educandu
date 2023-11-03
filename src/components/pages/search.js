import by from 'thenby';
import { Table, Tag } from 'antd';
import PropTypes from 'prop-types';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import TagSelector from '../tag-selector.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
import { useRequest } from '../request-context.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import ResourceInfoCell from '../resource-info-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { useEffect, useMemo, useState } from 'react';
import LanguageIcon from '../localization/language-icon.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';

const logger = new Logger(import.meta.url);

const SORTING_VALUE = {
  relevance: 'relevance',
  title: 'title',
  language: 'language',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn'
};

const SORTING_DIRECTION = {
  asc: 'asc',
  desc: 'desc'
};

const getSanitizedQueryFromRequest = request => {
  const query = request.query;
  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    query: query.query.trim(),
    tags: (query.tags?.trim() || '').split(',').filter(tag => tag),
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.relevance,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function Search({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('search');
  const { formatDate } = useDateFormat();
  const searchApiClient = useSessionAwareApiClient(SearchApiClient);

  const [allTags, setAllTags] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [unselectedTags, setUnselectedTags] = useState([]);

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [searchText, setSearchText] = useState(requestQuery.query);
  const [selectedTags, setSelectedTags] = useState(requestQuery.tags);
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  const sortingOptions = [
    { label: t('common:relevance'), appliedLabel: t('common:sortedByRelevance'), value: SORTING_VALUE.relevance },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: SORTING_VALUE.title },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: SORTING_VALUE.language },
    { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
    { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn }
  ];

  const sorters = useMemo(() => ({
    relevance: rowsToSort => rowsToSort.sort(by(row => row.document.relevance, sorting.direction).thenBy(row => row.document.updatedOn, SORTING_DIRECTION.desc)),
    title: rowsToSort => rowsToSort.sort(by(row => row.document.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.document.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.document.updatedOn, sorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.document.language, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      query: searchText,
      tags: selectedTags,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getSearchUrl(queryParams));
  }, [searchText, selectedTags, sorting, pagination]);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        const result = await searchApiClient.search(searchText.trim());
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
    const newRows = documents.map(doc => ({
      key: doc._id,
      document: doc
    }));

    const sorter = sorters[sorting.value];

    const filteredRows = newRows.filter(row => selectedTags.every(selectedTag => row.document.tags.some(tag => tag.toLowerCase() === selectedTag)));
    const sortedRows = sorter ? sorter(filteredRows) : filteredRows;

    setDisplayedRows(sortedRows);
  }, [documents, selectedTags, sorting, sorters]);

  const handleSelectTag = tag => setSelectedTags(ensureIsIncluded(selectedTags, tag));
  const handleDeselectTag = tag => setSelectedTags(ensureIsExcluded(selectedTags, tag));
  const handleDeselectTagsClick = () => setSelectedTags([]);
  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });
  const handleResultTableChange = ({ current, pageSize }) => setPagination({ page: current, pageSize });

  const renderLanguage = (_, row) => (
    <LanguageIcon language={row.document.language} />
  );

  const renderTitle = (_, row) => {
    const subtext = [
      `${t('created')}: ${formatDate(row.document.createdOn)}`,
      `${t('lastUpdate')}: ${formatDate(row.document.updatedOn)}`
    ].join(' | ');

    return (
      <ResourceInfoCell
        title={row.document.title}
        shortDescription={row.document.shortDescription}
        subtext={subtext}
        url={routes.getDocUrl({ id: row.document._id, slug: row.document.slug })}
        />
    );
  };

  const renderCellTags = (_, row) => (
    <div>
      <ItemsExpander
        className="SearchPage-cellTags"
        expandLinkClassName="SearchPage-cellTagsExpandLink"
        items={row.document.tags}
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
      key: 'title',
      render: renderTitle
    },
    {
      title: t('common:tags'),
      key: 'tags',
      render: renderCellTags,
      responsive: ['md'],
      width: '45%'
    },
    {
      title: t('common:language'),
      key: 'language',
      render: renderLanguage
    }
  ];

  const showSearchingHeadline = isSearching && documents.length === 0;

  return (
    <PageTemplate>
      <div className="SearchPage">
        <h1 className="SearchPage-headline">{t('common:search')}</h1>

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
              {t('common:removeAll')}
            </a>
          )}
        </div>

        <div className="SearchPage-resultsCount">
          {!!showSearchingHeadline && t('searching')}
          {!showSearchingHeadline && t('documentsFound', { count: displayedRows.length })}
        </div>

        <Table
          key={searchText}
          columns={columns}
          loading={isSearching}
          className="SearchPage-table u-table-with-pagination"
          dataSource={[...displayedRows]}
          rowClassName={() => 'SearchPage-tableRow'}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            showSizeChanger: true
          }}
          onChange={handleResultTableChange}
          />
      </div>
    </PageTemplate>
  );
}

Search.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Search;

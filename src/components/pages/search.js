import by from 'thenby';
import PropTypes from 'prop-types';
import { Radio, Table, Tag } from 'antd';
import SearchBar from '../search-bar.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import TagSelector from '../tag-selector.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import CloseIcon from '../icons/general/close-icon.js';
import ResourceTypeCell from '../resource-type-cell.js';
import ResourceInfoCell from '../resource-info-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import SearchApiClient from '../../api-clients/search-api-client.js';
import { ensureIsExcluded, ensureIsIncluded } from '../../utils/array-utils.js';
import { SEARCH_RESOURCE_TYPE, SORTING_DIRECTION } from '../../domain/constants.js';

const logger = new Logger(import.meta.url);

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const SORTING_VALUE = {
  relevance: 'relevance',
  title: 'title',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn',
  averageRatingValue: 'averageRatingValue'
};

const getSanitizedQueryFromRequest = request => {
  const query = request.query;
  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    query: query.query.trim(),
    tags: (query.tags?.trim() || '').split(',').filter(tag => tag),
    type: Object.values(SEARCH_RESOURCE_TYPE).includes(query.type) ? query.type : SEARCH_RESOURCE_TYPE.document,
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
  const [isSearching, setIsSearching] = useState(true);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [unselectedTags, setUnselectedTags] = useState([]);

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [searchText, setSearchText] = useState(requestQuery.query);
  const [selectedTags, setSelectedTags] = useState(requestQuery.tags);
  const [searchResourceType, setSearchResourceType] = useState(requestQuery.type);
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  const sortingOptions = [
    { label: t('common:relevance'), appliedLabel: t('common:sortedByRelevance'), value: SORTING_VALUE.relevance },
    { label: t('common:averageRatingValue'), appliedLabel: t('common:sortedByAverageRatingValue'), value: SORTING_VALUE.averageRatingValue },
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: SORTING_VALUE.title },
    { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
    { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn }
  ];

  const sorters = useMemo(() => ({
    relevance: rowsToSort => rowsToSort.sort(by(row => row.relevance, sorting.direction).thenBy(row => row.updatedOn, SORTING_DIRECTION.desc)),
    averageRatingValue: rowsToSort => rowsToSort.sort(by(row => row.rating ? row.rating.averageRatingValue : -1, sorting.direction).thenBy(row => row.rating ? row.rating.ratingsCount : 0, SORTING_DIRECTION.desc)),
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      query: searchText,
      tags: selectedTags,
      type: searchResourceType,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getSearchUrl(queryParams));
  }, [searchText, selectedTags, searchResourceType, sorting, pagination]);

  useEffect(() => {
    (async () => {
      setIsSearching(true);
      try {
        const results = await searchApiClient.search(searchText.trim());
        setSearchResults(results);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsSearching(false);
      }
    })();
  }, [searchText, searchApiClient, t]);

  useEffect(() => {
    const documentTags = searchResults.map(doc => doc.tags).flat().map(tag => tag.toLowerCase());
    setAllTags([...new Set(documentTags)]);
  }, [searchResults]);

  useEffect(() => {
    setUnselectedTags(allTags.filter(tag => !selectedTags.includes(tag)));
  }, [allTags, selectedTags]);

  useEffect(() => {
    const newRows = searchResults.map(result => ({
      key: result._id,
      ...result
    }));

    const sorter = sorters[sorting.value];

    let filteredRows = newRows
      .filter(row => selectedTags.every(selectedTag => row.tags.some(tag => tag.toLowerCase() === selectedTag)));

    if (searchResourceType !== SEARCH_RESOURCE_TYPE.any) {
      filteredRows = filteredRows.filter(row => row.searchResourceType === searchResourceType);
    }
    const sortedRows = sorter ? sorter(filteredRows) : filteredRows;

    setDisplayedRows(sortedRows);
  }, [searchResults, selectedTags, searchResourceType, sorting, sorters]);

  const handleSelectTag = tag => setSelectedTags(ensureIsIncluded(selectedTags, tag));
  const handleDeselectTag = tag => setSelectedTags(ensureIsExcluded(selectedTags, tag));
  const handleDeselectTagsClick = () => setSelectedTags([]);
  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });
  const handleResultTableChange = ({ current, pageSize }) => setPagination({ page: current, pageSize });
  const handleSearcheResourceTypeChange = event => setSearchResourceType(event.target.value);

  const renderType = (_, row) => (
    <ResourceTypeCell searchResourceType={row.searchResourceType} />
  );

  const renderTitle = (_, row) => {
    const subtext = [
      `${t('created')}: ${formatDate(row.createdOn)}`,
      `${t('lastUpdate')}: ${formatDate(row.updatedOn)}`
    ].join(' | ');

    const url = row.searchResourceType === SEARCH_RESOURCE_TYPE.document
      ? routes.getDocUrl({ id: row._id, slug: row.slug })
      : routes.getMediaLibraryItemUrl(row._id);

    return (
      <ResourceInfoCell
        title={row.title}
        documentRating={row.rating}
        shortDescription={row.shortDescription}
        subtext={subtext}
        url={url}
        />
    );
  };

  const renderCellTags = (_, row) => (
    <TagsExpander tags={row.tags} />
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
      title: t('common:type'),
      key: 'type',
      render: renderType,
      width: '60px'
    },
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
      width: '35%'
    }
  ];

  return (
    <PageTemplate>
      <div className="SearchPage">
        <h1 className="u-page-title">{t('common:search')}</h1>

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

        <RadioGroup className="SearchPage-typeFilter" value={searchResourceType} disabled={isSearching} onChange={handleSearcheResourceTypeChange}>
          <RadioButton value={SEARCH_RESOURCE_TYPE.document}>{t('common:searchResourceType_document')}</RadioButton>
          <RadioButton value={SEARCH_RESOURCE_TYPE.audio}>{t('common:resourceType_audio')}</RadioButton>
          <RadioButton value={SEARCH_RESOURCE_TYPE.video}>{t('common:resourceType_video')}</RadioButton>
          <RadioButton value={SEARCH_RESOURCE_TYPE.image}>{t('common:resourceType_image')}</RadioButton>
          <RadioButton value={SEARCH_RESOURCE_TYPE.pdf}>{t('common:resourceType_pdf')}</RadioButton>
          <RadioButton value={SEARCH_RESOURCE_TYPE.any}>{t('common:resourceType_any')}</RadioButton>
        </RadioGroup>

        <Table
          key={searchText}
          columns={columns}
          loading={isSearching}
          dataSource={[...displayedRows]}
          rowClassName={() => 'SearchPage-tableRow'}
          className="SearchPage-table u-table-with-pagination"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            showTotal: count => t('totalItems', { count })
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

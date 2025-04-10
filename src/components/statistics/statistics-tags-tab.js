import by from 'thenby';
import { TAB } from './constants.js';
import { Select, Table, Tag } from 'antd';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import SortingSelector from '../sorting-selector.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import MediaLibaryItemsModal, { MEDIA_LIBRARY_ITEMS_MODAL_MODE } from '../resource-selector/media-library/media-library-items-modal.js';

const TAG_CATEGORY_FILTER = {
  documentsAndMedia: 'documentsAndMedia',
  documentsOnly: 'documentsOnly',
  mediaOnly: 'mediaOnly'
};

const SORTING_VALUE = {
  name: 'name',
  frequency: 'frequency',
  companionTagCount: 'companionTagCount'
};

function createTableRow(tag) {
  return {
    key: tag,
    name: tag,
    frequency: 0,
    documents: [],
    mediaLibraryItems: [],
    companionTags: [],
    companionTagCount: 0,
    companionTagFrequencies: {}
  };
}

function createTableRows(documents, mediaLibraryItems, tagCategoryFilter) {
  const rowMap = new Map();

  if (tagCategoryFilter !== TAG_CATEGORY_FILTER.mediaOnly) {
    for (const doc of documents) {
      if (doc.publicContext?.archived === false) {
        for (const tag of doc.tags) {
          const row = rowMap.get(tag) || createTableRow(tag);
          row.documents = [...row.documents, doc];
          row.frequency = row.documents.length + row.mediaLibraryItems.length;
          for (const otherTag of doc.tags) {
            if (tag !== otherTag) {
              row.companionTagFrequencies[otherTag] = (row.companionTagFrequencies[otherTag] || 0) + 1;
            }
          }
          rowMap.set(tag, row);
        }
      }
    }
  }

  if (tagCategoryFilter !== TAG_CATEGORY_FILTER.documentsOnly) {
    for (const item of mediaLibraryItems) {
      for (const tag of item.tags) {
        const row = rowMap.get(tag) || createTableRow(tag);
        row.mediaLibraryItems = [...row.mediaLibraryItems, item];
        row.frequency = row.documents.length + row.mediaLibraryItems.length;
        for (const otherTag of item.tags) {
          if (tag !== otherTag) {
            row.companionTagFrequencies[otherTag] = (row.companionTagFrequencies[otherTag] || 0) + 1;
          }
        }
        rowMap.set(tag, row);
      }
    }
  }

  const finalRows = [...rowMap.values()];

  for (const row of finalRows) {
    row.documents.sort(by(x => x.title, { ignoreCase: true }));
    row.mediaLibraryItems.sort(by(x => x.name, { ignoreCase: true }));
    row.companionTags = Object.entries(row.companionTagFrequencies)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort(by(x => x.frequency, SORTING_DIRECTION.desc).thenBy(x => x.name, { ignoreCase: true }));
    row.companionTagCount = row.companionTags.length;
  }

  return finalRows;
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.tags ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    filter: (query.filter || '').trim(),
    tagCategoryFilter: Object.values(TAG_CATEGORY_FILTER).includes(query.tagCategoryFilter) ? query.tagCategoryFilter : TAG_CATEGORY_FILTER.documentsAndMedia,
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.frequency,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function getMediaLibraryItemsModalDefaultState() {
  return {
    mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.none,
    mediaLibraryItem: null,
    isOpen: false
  };
}

function StatisticsTagsTab() {
  const request = useRequest();
  const [documents, setDocuments] = useState([]);
  const { t } = useTranslation('statisticsTagsTab');
  const [mediaLibraryItems, setMediaLibraryItems] = useState([]);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [mediaLibraryItemsModalState, setMediaLibraryItemsModalState] = useState(getMediaLibraryItemsModalDefaultState());

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [tagCategoryFilter, setTagCategoryFilter] = useState(requestQuery.tagCategoryFilter);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);

      const [documentApiResponse, mediaLibraryApiResponse] = await Promise.all([
        documentApiClient.getStatisticsDocuments(),
        mediaLibraryApiClient.getStatisticsMediaLibraryItems()
      ]);

      setDocuments(documentApiResponse.documents);
      setMediaLibraryItems(mediaLibraryApiResponse.mediaLibraryItems);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData, documentApiClient, mediaLibraryApiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(createTableRows(documents, mediaLibraryItems, tagCategoryFilter));
  }, [documents, mediaLibraryItems, tagCategoryFilter]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      tagCategoryFilter,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getStatisticsUrl(TAB.tags, queryParams));
  }, [filter, tagCategoryFilter, sorting, pagination]);

  const tagCategoryFilterOptions = useMemo(() => {
    return Object.values(TAG_CATEGORY_FILTER).map(value => ({ value, label: t(`tagCategoryFilter_${value}`) }));
  }, [t]);

  const sortingOptions = useMemo(() => [
    { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: SORTING_VALUE.name },
    { label: t('frequency'), appliedLabel: t('sortedByFrequency'), value: SORTING_VALUE.frequency },
    { label: t('companionTagCount'), appliedLabel: t('sortedByCompanionTagCount'), value: SORTING_VALUE.companionTagCount }
  ], [t]);

  const tableSorters = useMemo(() => ({
    name: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.name, { direction, ignoreCase: true })),
    frequency: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.frequency, direction)),
    companionTagCount: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.companionTagCount, direction))
  }), []);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase().trim();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.name.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter(filteredRows, sorting.direction);

    setDisplayedRows(sortedRows);
  }, [allRows, filter, sorting, tableSorters]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleCurrentTableSortingChange = newSorting => {
    setSorting(newSorting);
  };

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleMediaLibraryItemPreviewClick = (mediaLibraryItem, event) => {
    event.preventDefault();
    setMediaLibraryItemsModalState({ mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview, mediaLibraryItem, isOpen: true });
  };

  const handleMediaLibraryItemsModalClose = () => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
  };

  const renderExpandedRow = row => {
    return (
      <div className="StatisticsTagsTab-expandedRow">
        {!!row.documents.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('documents')}:</div>
            <ul className="StatisticsTagsTab-documentList">
              {row.documents.map(doc => (
                <li key={doc._id}>
                  <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!row.mediaLibraryItems.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('mediaLibraryItems')}:</div>
            <ul className="StatisticsTagsTab-documentList">
              {row.mediaLibraryItems.map(item => (
                <li key={item._id}>
                  <a href={item.url} onClick={event => handleMediaLibraryItemPreviewClick(item, event)}>{item.name}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!row.companionTags.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('companionTags')}:</div>
            <div className="StatisticsTagsTab-companionTags">
              {row.companionTags.map(ctag => (
                <span key={ctag.name} className="StatisticsTagsTab-companionTag">
                  <Tag>{ctag.name}</Tag>
                  <span className="StatisticsTagsTab-companionTagFrequency">({ctag.frequency})</span>
                </span>
              ))}
            </div>
          </Fragment>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: t('frequency'),
      dataIndex: 'frequency',
      key: 'frequency'
    },
    {
      title: t('companionTagCount'),
      dataIndex: 'companionTagCount',
      key: 'companionTagCount'
    }
  ];

  return (
    <div className="StatisticsTagsTab">
      <div className="StatisticsTagsTab-controls">
        <FilterInput
          size="large"
          className="StatisticsTagsTab-textFilter"
          value={filter}
          onChange={handleFilterChange}
          placeholder={t('filterPlaceholder')}
          />
        <SortingSelector
          size="large"
          options={sortingOptions}
          sorting={sorting}
          onChange={handleCurrentTableSortingChange}
          />
        <Select
          value={tagCategoryFilter}
          options={tagCategoryFilterOptions}
          className="StatisticsTagsTab-tagCategoryFilter"
          onChange={setTagCategoryFilter}
          />
      </div>
      <Table
        className="u-table-with-pagination"
        columns={tableColumns}
        dataSource={displayedRows}
        expandable={{ expandedRowRender: renderExpandedRow }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          showSizeChanger: true
        }}
        loading={fetchingData}
        onChange={handleTableChange}
        />
      <MediaLibaryItemsModal {...mediaLibraryItemsModalState} onClose={handleMediaLibraryItemsModalClose} />
    </div>
  );
}

export default StatisticsTagsTab;

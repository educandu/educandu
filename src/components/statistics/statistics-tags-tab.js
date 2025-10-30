import by from 'thenby';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { Select, Spin, Table, Tag } from 'antd';
import SortingSelector from '../sorting-selector.js';
import { usePaging } from '../../ui/paging-hooks.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StatisticsApiClient from '../../api-clients/statistics-api-client.js';
import { useDebouncedFetchingState, useInitialQuery } from '../../ui/hooks.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { createSorter, useSorting, useSortingConfiguration } from '../../ui/sorting-hooks.js';
import { createTextFilter, useFiltering, useFilteringConfiguration } from '../../ui/filtering-hooks.js';
import { useNumberFormat } from '../locale-context.js';

const TAG_CATEGORY_FILTER = {
  documentsAndMedia: 'documentsAndMedia',
  documentsOnly: 'documentsOnly',
  mediaOnly: 'mediaOnly'
};

const textFilter = createTextFilter('text', (item, filterValue) => {
  return item.tag.toLowerCase().includes(filterValue);
}, { prepareFilterValue: filterValue => filterValue.toLowerCase(), skipFilterIf: filterValue => !filterValue });
const tagCategoryFilter = createTextFilter('tagCategory', (item, filterValue) => {
  return (filterValue === TAG_CATEGORY_FILTER.documentsOnly && item.documentCount)
    || (filterValue === TAG_CATEGORY_FILTER.mediaOnly && item.mediaLibraryItemCount);
}, { defaultValue: TAG_CATEGORY_FILTER.documentsAndMedia, skipFilterIf: filterValue => !filterValue || filterValue === TAG_CATEGORY_FILTER.documentsAndMedia });

const filteringParams = {
  filters: [textFilter, tagCategoryFilter]
};

const tagSorter = createSorter('tag', 'tag', 'sortedByTag', direction => by(item => item.tag, { direction, ignoreCase: true }));
const lengthSorter = createSorter('length', 'length', 'sortedByLength', direction => by(item => item.tag.length, { direction }));
const totalCountSorter = createSorter('totalCount', 'totalCount', 'sortedByTotalCount', direction => by(item => item.totalCount, { direction }));
const documentCountSorter = createSorter('documentCount', 'documentCount', 'sortedByDocumentCount', direction => by(item => item.documentCount, { direction }));
const mediaLibraryItemCountSorter = createSorter('mediaLibraryItemCount', 'mediaLibraryItemCount', 'sortedByMediaLibraryItemCount', direction => by(item => item.mediaLibraryItemCount, { direction }));

const sortingParams = {
  sorters: [tagSorter, lengthSorter, totalCountSorter, documentCountSorter, mediaLibraryItemCountSorter],
  defaultSorting: [['totalCount', SORTING_DIRECTION.desc]]
};

function StatisticsTagsTab() {
  const formatNumber = useNumberFormat();
  const { t } = useTranslation('statisticsTagsTab');
  const statisticsApiClient = useSessionAwareApiClient(StatisticsApiClient);
  const [isFetchingItems, setIsFetchingItems] = useDebouncedFetchingState(true);

  const initialQuery = useInitialQuery(query => query.tab === TAB.tags ? query : {});

  const { filteringConfiguration } = useFilteringConfiguration(filteringParams.filters);

  const { sortingConfiguration, sortingSelectorOptions } = useSortingConfiguration(sortingParams.sorters, sortingParams.defaultSorting, t);

  const { filtering, getTextFilterValue, handleTextFilterChange, filterItems } = useFiltering(initialQuery, filteringConfiguration);
  const { sorting, handleSortingSelectorChange, sortItems } = useSorting(initialQuery, sortingConfiguration);
  const { paging, handleAntdTableChange, adjustPagingToItems } = usePaging(initialQuery);

  const [totals, setTotals] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [tagDetailsMap, setTagDetailsMap] = useState({});
  const [displayedItems, setDisplayedItems] = useState([]);

  const fetchItems = useCallback(async () => {
    try {
      setIsFetchingItems(true);
      const apiClientResponse = await statisticsApiClient.getTags();
      setAllItems(apiClientResponse.tags);
    } finally {
      setIsFetchingItems(false);
    }
  }, [setIsFetchingItems, statisticsApiClient]);

  const fetchTagDetails = useCallback(async tag => {
    setTagDetailsMap(oldValue => ({
      ...oldValue,
      [tag]: { isLoading: true, hasError: false, tagDetails: null }
    }));
    try {
      const apiClientResponse = await statisticsApiClient.getTagDetails({ tag });
      setTagDetailsMap(oldValue => ({
        ...oldValue,
        [tag]: { isLoading: false, hasError: false, tagDetails: apiClientResponse.tagDetails }
      }));
    } catch (error) {
      setTagDetailsMap(oldValue => ({
        ...oldValue,
        [tag]: { isLoading: false, hasError: true, tagDetails: null }
      }));
    }
  }, [statisticsApiClient]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [paging]);

  useEffect(() => {
    history.replaceState(null, '', routes.getStatisticsUrl(TAB.tags, {
      ...filtering.query,
      ...sorting.query,
      ...paging.query
    }));
  }, [filtering, sorting, paging]);

  useEffect(() => {
    if (isFetchingItems) {
      return;
    }

    const newDisplayedItems = sortItems(filterItems(allItems));

    const newTotals = {
      totalCount: 0,
      documentCount: 0,
      mediaLibraryItemCount: 0
    };

    for (const item of newDisplayedItems) {
      newTotals.totalCount += item.totalCount;
      newTotals.documentCount += item.documentCount;
      newTotals.mediaLibraryItemCount += item.mediaLibraryItemCount;
    }

    setTotals(newTotals);
    setDisplayedItems(newDisplayedItems);
    adjustPagingToItems(newDisplayedItems);
  }, [isFetchingItems, allItems, filterItems, sortItems, adjustPagingToItems]);

  const tagCategoryFilterOptions = useMemo(() => {
    return Object.values(TAG_CATEGORY_FILTER).map(value => ({ value, label: t(`tagCategoryFilter_${value}`) }));
  }, [t]);

  const renderExpandedRow = ({ tag }) => {
    const entry = tagDetailsMap[tag];
    if (!entry) {
      setTimeout(() => fetchTagDetails(tag), 0);
    }

    if (!entry || entry.isLoading) {
      return (
        <div className="StatisticsTagsTab-expandedRow StatisticsTagsTab-expandedRow--loading">
          <Spin />
        </div>
      );
    }

    if (entry.hasError) {
      return (
        <div className="StatisticsTagsTab-expandedRow StatisticsTagsTab-expandedRow--error">
          {t('tagDetailsErrorMessage')}
        </div>
      );
    }

    return (
      <div className="StatisticsTagsTab-expandedRow StatisticsTagsTab-expandedRow--data">
        {!!entry.tagDetails.documents.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('documents')}:</div>
            <ul className="StatisticsTagsTab-documentList">
              {entry.tagDetails.documents.map(doc => (
                <li key={doc._id}>
                  <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!entry.tagDetails.mediaLibraryItems.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('mediaLibraryItems')}:</div>
            <ul className="StatisticsTagsTab-documentList">
              {entry.tagDetails.mediaLibraryItems.map(item => (
                <li key={item._id}>
                  <a href={routes.getMediaLibraryItemUrl(item._id)}>{item.name}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!entry.tagDetails.companionTags.length && (
          <Fragment>
            <div className="StatisticsTagsTab-expandedRowHeader">{t('companionTags')}:</div>
            <div className="StatisticsTagsTab-companionTags">
              {entry.tagDetails.companionTags.map(ctag => (
                <span key={ctag.tag} className="StatisticsTagsTab-companionTag">
                  <Tag>{ctag.tag}</Tag>
                  <span className="StatisticsTagsTab-companionTagFrequency">({ctag.count})</span>
                </span>
              ))}
            </div>
          </Fragment>
        )}
      </div>
    );
  };

  const renderColumnTitleWithCountSubtitle = ({ title, count = 0 }) => {
    return (
      <div className="StatisticsTagsTab-titleCell">
        <div>
          {title}
        </div>
        <div className='StatisticsTagsTab-titleCellSubtitle'>
          ({formatNumber(count)})
        </div>
      </div>
    );
  };

  const tableColumns = [
    {
      title: t('tag'),
      dataIndex: 'tag',
      key: 'tag'
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('frequencyHeaderTotal'),
        count: totals?.totalCount
      }),
      dataIndex: 'totalCount',
      key: 'totalCount',
      align: 'center',
      width: '140px'
    },
    {
      title: t('frequencyHeaderBySource'),
      responsive: ['sm'],
      align: 'center',
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('frequencyHeaderDocuments'),
            count: totals?.documentCount
          }),
          dataIndex: 'documentCount',
          key: 'documentCount',
          align: 'center',
          width: '140px'
        },
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('frequencyHeaderMediaLibraryItems'),
            count: totals?.mediaLibraryItemCount
          }),
          dataIndex: 'mediaLibraryItemCount',
          key: 'mediaLibraryItemCount',
          align: 'center',
          width: '140px'
        }
      ]
    }
  ];

  return (
    <div className="StatisticsTagsTab">
      <div className="StatisticsTagsTab-filters">
        <FilterInput
          disabled={isFetchingItems}
          value={getTextFilterValue('text')}
          placeholder={t('textFilterPlaceholder')}
          className="StatisticsTagsTab-textFilter"
          onChange={event => handleTextFilterChange('text', event.target.value)}
          />
        <Select
          disabled={isFetchingItems}
          options={tagCategoryFilterOptions}
          value={getTextFilterValue('tagCategory')}
          className="StatisticsTagsTab-tagCategoryFilter"
          onChange={newValue => handleTextFilterChange('tagCategory', newValue)}
          />
        <div className="StatisticsTagsTab-sortingSelector">
          <SortingSelector
            size="large"
            options={sortingSelectorOptions}
            sorting={sorting.sortingSelectorSorting}
            onChange={handleSortingSelectorChange}
            />
        </div>
      </div>
      <Table
        rowKey="tag"
        columns={tableColumns}
        loading={isFetchingItems}
        dataSource={displayedItems}
        className="u-table-with-pagination"
        pagination={paging.antdTablePagination}
        expandable={{ expandedRowRender: renderExpandedRow }}
        onChange={handleAntdTableChange}
        />
    </div>
  );
}

export default StatisticsTagsTab;

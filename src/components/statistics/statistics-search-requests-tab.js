import by from 'thenby';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { TableExportIcon } from '../icons/icons.js';
import { usePaging } from '../../ui/paging-hooks.js';
import { useService } from '../container-context.js';
import SortingSelector from '../sorting-selector.js';
import { objectsToCsv } from '../../utils/csv-utils.js';
import HttpClient from '../../api-clients/http-client.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { Table, Tag, DatePicker, Button, Tooltip } from 'antd';
import { tokenizeForSearch } from '../../utils/string-utils.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useDateFormat, useNumberFormat } from '../locale-context.js';
import StatisticsApiClient from '../../api-clients/statistics-api-client.js';
import { useDebouncedFetchingState, useInitialQuery } from '../../ui/hooks.js';
import { createSorter, useSorting, useSortingConfiguration } from '../../ui/sorting-hooks.js';
import { createDateFilter, createTextFilter, useFiltering, useFilteringConfiguration } from '../../ui/filtering-hooks.js';

const { RangePicker } = DatePicker;

const textFilter = createTextFilter('text', (item, filterValue) => {
  return item.query.toLowerCase().includes(filterValue);
}, { prepareFilterValue: filterValue => filterValue.toLowerCase(), skipFilterIf: filterValue => !filterValue });
const registeredFromFilter = createDateFilter('registeredFrom', (item, filterValue) => new Date(item.registeredOn) >= filterValue);
const registeredUntilFilter = createDateFilter('registeredUntil', (item, filterValue) => new Date(item.registeredOn) <= filterValue);

const filteringParams = {
  filters: [textFilter, registeredFromFilter, registeredUntilFilter]
};

const querySorter = createSorter('query', 'query', 'sortedByQuery', (items, direction) => [...items].sort(by(item => item.query, { direction, ignoreCase: true })));
const registeredOnSorter = createSorter('registeredOn', 'registeredOn', 'sortedByRegisteredOn', (items, direction) => [...items].sort(by(item => item.registeredOn, { direction })));
const totalMatchCountSorter = createSorter('totalMatchCount', 'totalMatchCount', 'sortedByTotalMatchCount', (items, direction) => [...items].sort(by(item => item.totalMatchCount, { direction })));
const documentMatchCountSorter = createSorter('documentMatchCount', 'documentMatchCount', 'sortedByDocumentMatchCount', (items, direction) => [...items].sort(by(item => item.documentMatchCount, { direction })));
const mediaLibraryItemMatchCountSorter = createSorter('mediaLibraryItemMatchCount', 'mediaLibraryItemMatchCount', 'sortedByMediaLibraryItemMatchCount', (items, direction) => [...items].sort(by(item => item.mediaLibraryItemMatchCount, { direction })));

const sortingParams = {
  sorters: [querySorter, registeredOnSorter, totalMatchCountSorter, documentMatchCountSorter, mediaLibraryItemMatchCountSorter],
  defaultSorter: registeredOnSorter,
  defaultDirection: SORTING_DIRECTION.desc
};

function StatisticsSearchRequestsTab() {
  const formatNumber = useNumberFormat();
  const httpClient = useService(HttpClient);
  const { dateFormat, formatDate } = useDateFormat();
  const { t } = useTranslation('statisticsSearchRequestsTab');
  const statisticsApiClient = useSessionAwareApiClient(StatisticsApiClient);
  const [isFetchingItems, setIsFetchingItems] = useDebouncedFetchingState(true);

  const initialQuery = useInitialQuery(query => query.tab === TAB.searchRequests ? query : {});

  const { filteringConfiguration } = useFilteringConfiguration(filteringParams.filters);

  const { sortingConfiguration, sortingSelectorOptions } = useSortingConfiguration(sortingParams.sorters, sortingParams.defaultSorter, sortingParams.defaultDirection, t);

  const { filtering, getTextFilterValue, getRangePickerFilterValues, handleTextFilterChange, handleDateRangeFilterChange, filterItems } = useFiltering(initialQuery, filteringConfiguration);
  const { sorting, handleSortingSelectorChange, sortItems } = useSorting(initialQuery, sortingConfiguration);
  const { paging, handleAntdTableChange, adjustPagingToItems } = usePaging(initialQuery);

  const [totals, setTotals] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);

  const fetchItems = useCallback(async () => {
    try {
      setIsFetchingItems(true);
      const apiClientResponse = await statisticsApiClient.getSearchRequests();

      const { searchRequests } = apiClientResponse;

      for (const searchRequest of searchRequests) {
        searchRequest.totalMatchCount = searchRequest.documentMatchCount + searchRequest.mediaLibraryItemMatchCount;
      }

      setAllItems(searchRequests);
    } finally {
      setIsFetchingItems(false);
    }
  }, [setIsFetchingItems, statisticsApiClient]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [paging]);

  useEffect(() => {
    history.replaceState(null, '', routes.getStatisticsUrl(TAB.searchRequests, {
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
      totalMatchCount: 0,
      documentMatchCount: 0,
      mediaLibraryItemMatchCount: 0
    };

    for (const item of newDisplayedItems) {
      newTotals.totalMatchCount += item.totalMatchCount;
      newTotals.documentMatchCount += item.documentMatchCount;
      newTotals.mediaLibraryItemMatchCount += item.mediaLibraryItemMatchCount;
    }

    setTotals(newTotals);
    setDisplayedItems(newDisplayedItems);
    adjustPagingToItems(newDisplayedItems);
  }, [isFetchingItems, allItems, filterItems, sortItems, adjustPagingToItems]);

  const handleExportToCsvButtonClick = async () => {
    const itemPropsToIncludeInCsv = [
      'query',
      'registeredOn',
      'totalMatchCount',
      'documentMatchCount',
      'mediaLibraryItemMatchCount'
    ];
    const csv = objectsToCsv(displayedItems, itemPropsToIncludeInCsv);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    await httpClient.download(url, 'user-contributions.csv');
    URL.revokeObjectURL(url);
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const renderColumnTitleWithCountSubtitle = ({ title, count = 0 }) => {
    return (
      <div className="StatisticsSearchRequestsTab-titleCell">
        <div>
          {title}
        </div>
        <div className='StatisticsSearchRequestsTab-titleCellSubtitle'>
          ({formatNumber(count)})
        </div>
      </div>
    );
  };

  const renderExpandedRow = row => {
    const searchTokens = [...tokenizeForSearch(row.query).allTokens];
    return (
      <div className="StatisticsSearchRequestsTab-expandedRow">
        <div className="StatisticsSearchRequestsTab-expandedRowHeader">{t('searchTokens')}:</div>
        <div className="StatisticsSearchRequestsTab-searchTokenList">
          {!searchTokens.length && (
            <i>({t('noSearchTokens')})</i>
          )}
          {!!searchTokens.length && searchTokens.map(token => (
            <Tag className="Tag" key={token}>{token}</Tag>
          ))}
        </div>
      </div>
    );
  };

  const renderQuery = query => {
    return (
      <span title={query} className="StatisticsSearchRequestsTab-queryCell">
        {query}
      </span>
    );
  };

  const tableColumns = [
    {
      title: t('query'),
      dataIndex: 'query',
      key: 'query',
      render: renderQuery
    },
    {
      title: t('registeredOn'),
      dataIndex: 'registeredOn',
      key: 'registeredOn',
      render: registeredOn => formatDate(registeredOn),
      width: '180px'
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('totalMatchCountColumnHeader'),
        count: totals?.totalMatchCount
      }),
      dataIndex: 'totalMatchCount',
      key: 'totalMatchCount',
      render: totalMatchCount => formatNumber(totalMatchCount),
      align: 'center',
      width: '140px'
    },
    {
      title: t('categorizedMatchCountColumnHeader'),
      responsive: ['sm'],
      align: 'center',
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('documentMatchCountColumnHeader'),
            count: totals?.documentMatchCount
          }),
          dataIndex: 'documentMatchCount',
          key: 'documentMatchCount',
          render: documentMatchCount => formatNumber(documentMatchCount),
          align: 'center',
          width: '140px'
        },
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('mediaLibraryItemMatchCountColumnHeader'),
            count: totals?.mediaLibraryItemMatchCount
          }),
          dataIndex: 'mediaLibraryItemMatchCount',
          key: 'mediaLibraryItemMatchCount',
          render: mediaLibraryItemMatchCount => formatNumber(mediaLibraryItemMatchCount),
          align: 'center',
          width: '140px'
        }
      ]
    }
  ];

  return (
    <div className="StatisticsSearchRequestsTab">
      <div className="StatisticsSearchRequestsTab-filters">
        <FilterInput
          disabled={isFetchingItems}
          value={getTextFilterValue('text')}
          placeholder={t('textFilterPlaceholder')}
          className="StatisticsSearchRequestsTab-textFilter"
          onChange={event => handleTextFilterChange('text', event.target.value)}
          />
        <RangePicker
          allowClear
          allowEmpty
          format={dateFormat}
          disabled={isFetchingItems}
          disabledDate={determineDisabledDate}
          className="StatisticsSearchRequestsTab-registeredDateFilter"
          placeholder={[t('common:fromDate'), t('common:untilDate')]}
          value={getRangePickerFilterValues(['registeredFrom', 'registeredUntil'])}
          onChange={newValues => handleDateRangeFilterChange(['registeredFrom', 'registeredUntil'], newValues)}
          />
        <div className="StatisticsSearchRequestsTab-sortingSelector">
          <SortingSelector
            size="large"
            options={sortingSelectorOptions}
            sorting={sorting.sortingSelectorSorting}
            onChange={handleSortingSelectorChange}
            />
        </div>
      </div>
      <div className="StatisticsSearchRequestsTab-csvExportButton">
        <Tooltip title={t('exportAsCsv')}>
          <Button
            icon={<TableExportIcon />}
            onClick={handleExportToCsvButtonClick}
            />
        </Tooltip>
      </div>
      <Table
        rowKey="_id"
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

export default StatisticsSearchRequestsTab;

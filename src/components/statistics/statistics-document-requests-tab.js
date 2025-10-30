import by from 'thenby';
import { TAB } from './constants.js';
import deepEqual from 'fast-deep-equal';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { TableExportIcon } from '../icons/icons.js';
import { usePaging } from '../../ui/paging-hooks.js';
import { useService } from '../container-context.js';
import { objectsToCsv } from '../../utils/csv-utils.js';
import DaysOfWeekSelect from '../days-of-week-select.js';
import HttpClient from '../../api-clients/http-client.js';
import { Table, DatePicker, Button, Tooltip } from 'antd';
import MultiSortingSelector from '../multi-sorting-selector.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useDateFormat, useNumberFormat } from '../locale-context.js';
import { DAY_OF_WEEK, SORTING_DIRECTION } from '../../domain/constants.js';
import StatisticsApiClient from '../../api-clients/statistics-api-client.js';
import { useDebouncedFetchingState, useInitialQuery } from '../../ui/hooks.js';
import { createSorter, useSorting, useSortingConfiguration } from '../../ui/sorting-hooks.js';
import { createDateFilter, createTextFilter, useFiltering, useFilteringConfiguration } from '../../ui/filtering-hooks.js';

const { RangePicker } = DatePicker;

const textFilter = createTextFilter('text', (item, filterValue) => {
  return item.documentTitle.toLowerCase().includes(filterValue);
}, { prepareFilterValue: filterValue => filterValue.toLowerCase(), skipFilterIf: filterValue => !filterValue });
const registeredFromFilter = createDateFilter('registeredFrom');
const registeredUntilFilter = createDateFilter('registeredUntil');
const daysOfWeekFilter = createTextFilter('daysOfWeek', null, { defaultValue: Object.values(DAY_OF_WEEK).join('') });

const filteringParams = {
  filters: [textFilter, registeredFromFilter, registeredUntilFilter, daysOfWeekFilter]
};

const totalCountSorter = createSorter('totalCount', 'totalCountColumnHeader', 'sortedByTotalCount', direction => by(item => item.totalCount, { direction }));
const readCountSorter = createSorter('readCount', 'readCountColumnHeader', 'sortedByReadCount', direction => by(item => item.readCount, { direction }));
const writeCountSorter = createSorter('writeCount', 'writeCountColumnHeader', 'sortedByWriteCount', direction => by(item => item.writeCount, { direction }));
const anonymousCountSorter = createSorter('anonymousCount', 'anonymousCountColumnHeader', 'sortedByAnonymousCount', direction => by(item => item.anonymousCount, { direction }));
const loggedInCountSorter = createSorter('loggedInCount', 'loggedInCountColumnHeader', 'sortedByLoggedInCount', direction => by(item => item.loggedInCount, { direction }));

const sortingParams = {
  sorters: [totalCountSorter, readCountSorter, writeCountSorter, anonymousCountSorter, loggedInCountSorter],
  defaultSorting: [['totalCount', SORTING_DIRECTION.desc]]
};

function StatisticsDocumentRequestsTab() {
  const formatNumber = useNumberFormat();
  const { dateFormat } = useDateFormat();
  const httpClient = useService(HttpClient);
  const { t } = useTranslation('statisticsDocumentRequestsTab');
  const statisticsApiClient = useSessionAwareApiClient(StatisticsApiClient);
  const [isFetchingItems, setIsFetchingItems] = useDebouncedFetchingState(true);

  const initialQuery = useInitialQuery(query => query.tab === TAB.documentRequests ? query : {});

  const { filteringConfiguration } = useFilteringConfiguration(filteringParams.filters);

  const { sortingConfiguration, sortingSelectorOptions, multiSortingSelectorDefaultSorting } = useSortingConfiguration(sortingParams.sorters, sortingParams.defaultSorting, t, true);

  const { filtering, getTextFilterValue, getDateFilterValuesAsMilliseconds, getRangePickerFilterValues, handleTextFilterChange, handleDateRangeFilterChange, filterItems } = useFiltering(initialQuery, filteringConfiguration);
  const { sorting, handleMultiSortingSelectorChange, sortItems } = useSorting(initialQuery, sortingConfiguration);
  const { paging, handleAntdTableChange, adjustPagingToItems } = usePaging(initialQuery);

  const [totals, setTotals] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);

  const [serverSideFilters, setServerSideFilters] = useState({
    ...getDateFilterValuesAsMilliseconds(['registeredFrom', 'registeredUntil']),
    daysOfWeek: getTextFilterValue('daysOfWeek') || null
  });

  const fetchItems = useCallback(async () => {
    try {
      setIsFetchingItems(true);
      const apiClientResponse = await statisticsApiClient.getStatisticsDocumentRequests({ ...serverSideFilters });
      setAllItems(apiClientResponse.documentRequestCounters);
    } finally {
      setIsFetchingItems(false);
    }
  }, [serverSideFilters, setIsFetchingItems, statisticsApiClient]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [paging]);

  useEffect(() => {
    history.replaceState(null, '', routes.getStatisticsUrl(TAB.documentRequests, {
      ...filtering.query,
      ...sorting.query,
      ...paging.query
    }));
  }, [filtering, sorting, paging]);

  useEffect(() => {
    if (isFetchingItems) {
      return;
    }

    setServerSideFilters(oldRange => {
      const newRange = {
        ...getDateFilterValuesAsMilliseconds(['registeredFrom', 'registeredUntil']),
        daysOfWeek: getTextFilterValue('daysOfWeek')
      };
      return deepEqual(oldRange, newRange) ? oldRange : newRange;
    });

    const newDisplayedItems = sortItems(filterItems(allItems));

    const newTotals = {
      totalCount: 0,
      readCount: 0,
      writeCount: 0,
      anonymousCount: 0,
      loggedInCount: 0
    };

    for (const item of newDisplayedItems) {
      newTotals.totalCount += item.totalCount;
      newTotals.readCount += item.readCount;
      newTotals.writeCount += item.writeCount;
      newTotals.anonymousCount += item.anonymousCount;
      newTotals.loggedInCount += item.loggedInCount;
    }

    setTotals(newTotals);
    setDisplayedItems(newDisplayedItems);
    adjustPagingToItems(newDisplayedItems);
  }, [isFetchingItems, allItems, getDateFilterValuesAsMilliseconds, getTextFilterValue, filterItems, sortItems, adjustPagingToItems]);

  const handleExportToCsvButtonClick = async () => {
    const rowPropsToIncludeInCsv = [
      'documentId',
      'documentTitle',
      'totalCount',
      'readCount',
      'writeCount',
      'anonymousCount',
      'loggedInCount'
    ];
    const csv = objectsToCsv(displayedItems, rowPropsToIncludeInCsv);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    await httpClient.download(url, 'document-requests.csv');
    URL.revokeObjectURL(url);
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const renderColumnTitleWithCountSubtitle = ({ title, count = 0 }) => {
    return (
      <div className="StatisticsDocumentRequestsTab-titleCell">
        <div>
          {title}
        </div>
        <div className='StatisticsDocumentRequestsTab-titleCellSubtitle'>
          ({formatNumber(count)})
        </div>
      </div>
    );
  };

  const renderDocument = (_, item) => {
    const documentUrl = routes.getDocUrl({ id: item.documentId, slug: item.documentSlug });
    return (
      <a href={documentUrl} className="StatisticsDocumentRequestsTab-documentTitleCell">
        {item.documentTitle}
      </a>
    );
  };

  const tableColumns = [
    {
      title: t('common:document'),
      key: 'document',
      render: renderDocument
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('totalCountColumnHeader'),
        count: totals?.totalCount
      }),
      key: 'totalCount',
      render: (_, item) => formatNumber(item.totalCount),
      align: 'center',
      width: '100px'
    },
    {
      title: t('requestColumnHeader'),
      responsive: ['sm'],
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('readCountColumnHeader'),
            count: totals?.readCount
          }),
          key: 'readCount',
          render: (_, item) => formatNumber(item.readCount),
          align: 'center',
          width: '100px'
        },
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('writeCountColumnHeader'),
            count: totals?.writeCount
          }),
          key: 'writeCount',
          render: (_, item) => formatNumber(item.writeCount),
          align: 'center',
          width: '100px'
        }
      ]
    },
    {
      title: t('userColumnHeader'),
      responsive: ['md'],
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('anonymousCountColumnHeader'),
            count: totals?.anonymousCount
          }),
          key: 'anonymousCount',
          render: (_, item) => formatNumber(item.anonymousCount),
          align: 'center',
          width: '100px'
        },
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('loggedInCountColumnHeader'),
            count: totals?.loggedInCount
          }),
          key: 'loggedInCount',
          render: (_, item) => formatNumber(item.loggedInCount),
          align: 'center',
          width: '100px'
        }
      ]
    }
  ];

  return (
    <div className="StatisticsDocumentRequestsTab">
      <div className="StatisticsDocumentRequestsTab-filters">
        <FilterInput
          disabled={isFetchingItems}
          value={getTextFilterValue('text')}
          placeholder={t('titlePlaceholder')}
          className="StatisticsDocumentRequestsTab-textFilter"
          onChange={event => handleTextFilterChange('text', event.target.value)}
          />
        <RangePicker
          allowClear
          allowEmpty
          format={dateFormat}
          disabled={isFetchingItems}
          disabledDate={determineDisabledDate}
          className="StatisticsDocumentRequestsTab-registerDateFilter"
          placeholder={[t('common:fromDate'), t('common:untilDate')]}
          value={getRangePickerFilterValues(['registeredFrom', 'registeredUntil'])}
          onChange={newValues => handleDateRangeFilterChange(['registeredFrom', 'registeredUntil'], newValues)}
          />
        <div className="StatisticsDocumentRequestsTab-daysOfWeekFilter">
          <DaysOfWeekSelect
            disabled={isFetchingItems}
            value={getTextFilterValue('daysOfWeek')}
            onChange={newValue => handleTextFilterChange('daysOfWeek', newValue)}
            />
        </div>
        <div className="StatisticsDocumentRequestsTab-sortingSelector">
          <MultiSortingSelector
            size="large"
            options={sortingSelectorOptions}
            sortings={sorting.multiSortingSelectorSorting}
            defaultSorting={multiSortingSelectorDefaultSorting}
            onChange={handleMultiSortingSelectorChange}
            />
        </div>
      </div>
      <div className="StatisticsDocumentRequestsTab-csvExportButton">
        <Tooltip title={t('exportAsCsv')}>
          <Button
            disabled={isFetchingItems}
            icon={<TableExportIcon />}
            onClick={handleExportToCsvButtonClick}
            />
        </Tooltip>
      </div>
      <Table
        rowKey="documentId"
        columns={tableColumns}
        loading={isFetchingItems}
        dataSource={displayedItems}
        className="u-table-with-pagination"
        pagination={paging.antdTablePagination}
        onChange={handleAntdTableChange}
        />
    </div>
  );
}

export default StatisticsDocumentRequestsTab;

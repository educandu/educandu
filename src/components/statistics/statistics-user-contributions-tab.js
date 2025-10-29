import by from 'thenby';
import { TAB } from './constants.js';
import deepEqual from 'fast-deep-equal';
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
import { Table, DatePicker, Button, Tooltip, Spin } from 'antd';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useDateFormat, useNumberFormat } from '../locale-context.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import StatisticsApiClient from '../../api-clients/statistics-api-client.js';
import { useDebouncedFetchingState, useInitialQuery } from '../../ui/hooks.js';
import { createSorter, useSorting, useSortingConfiguration } from '../../ui/sorting-hooks.js';
import { createDateFilter, createTextFilter, useFiltering, useFilteringConfiguration } from '../../ui/filtering-hooks.js';

const { RangePicker } = DatePicker;

const textFilter = createTextFilter('text', (item, filterValue) => {
  return item.userDisplayName.toLowerCase().includes(filterValue);
}, { prepareFilterValue: filterValue => filterValue.toLowerCase(), skipFilterIf: filterValue => !filterValue });
const contributedFromFilter = createDateFilter('contributedFrom');
const contributedUntilFilter = createDateFilter('contributedUntil');

const filteringParams = {
  filters: [textFilter, contributedFromFilter, contributedUntilFilter]
};

const querySorter = createSorter('user', 'userNameColumnHeader', 'sortedByUserName', (items, direction) => [...items].sort(by(item => item.userDisplayName, { direction, ignoreCase: true })));
const documentsCreatedSorter = createSorter('documentsCreated', 'createdDocumentsCountColumnHeader', 'sortedByCreatedDocuments', (items, direction) => [...items].sort(by(item => item.documentsCreatedCount, { direction })));
const documentsContributedToSorter = createSorter('documentsContributedTo', 'editedDocumentsCountColumnHeader', 'sortedByEditedDocuments', (items, direction) => [...items].sort(by(item => item.documentsContributedToCount, { direction })));
const ownDocumentsContributedToSorter = createSorter('ownDocumentsContributedTo', 'ownEditedDocumentsCountSortingHeader', 'sortedByOwnEditedDocuments', (items, direction) => [...items].sort(by(item => item.ownDocumentsContributedToCount, { direction })));
const otherDocumentsContributedToSorter = createSorter('otherDocumentsContributedTo', 'otherEditedDocumentsCountSortingHeader', 'sortedByOtherEditedDocuments', (items, direction) => [...items].sort(by(item => item.otherDocumentsContributedToCount, { direction })));

const sortingParams = {
  sorters: [querySorter, documentsCreatedSorter, documentsContributedToSorter, ownDocumentsContributedToSorter, otherDocumentsContributedToSorter],
  defaultSorter: documentsContributedToSorter,
  defaultDirection: SORTING_DIRECTION.desc
};

function StatisticsUserContributionsTab() {
  const { dateFormat } = useDateFormat();
  const formatNumber = useNumberFormat();
  const httpClient = useService(HttpClient);
  const { t } = useTranslation('statisticsUserContributionsTab');
  const statisticsApiClient = useSessionAwareApiClient(StatisticsApiClient);
  const [isFetchingItems, setIsFetchingItems] = useDebouncedFetchingState(true);

  const initialQuery = useInitialQuery(query => query.tab === TAB.userContributions ? query : {});

  const { filteringConfiguration } = useFilteringConfiguration(filteringParams.filters);

  const { sortingConfiguration, sortingSelectorOptions } = useSortingConfiguration(sortingParams.sorters, sortingParams.defaultSorter, sortingParams.defaultDirection, t);

  const { filtering, getTextFilterValue, getDateFilterValuesAsMilliseconds, getRangePickerFilterValues, handleTextFilterChange, handleDateRangeFilterChange, filterItems } = useFiltering(initialQuery, filteringConfiguration);
  const { sorting, handleSortingSelectorChange, sortItems } = useSorting(initialQuery, sortingConfiguration);
  const { paging, handleAntdTableChange, adjustPagingToItems } = usePaging(initialQuery);

  const [totals, setTotals] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [documentsMap, setDocumentsMap] = useState({});
  const [displayedItems, setDisplayedItems] = useState([]);
  const [userContributionsDetailsMap, setUserContributionsDetailsMap] = useState({});

  const [searchDateRange, setSearchDateRange] = useState(getDateFilterValuesAsMilliseconds(['contributedFrom', 'contributedUntil']));

  const fetchItems = useCallback(async () => {
    try {
      setIsFetchingItems(true);
      const apiClientResponse = await statisticsApiClient.getUserContributions({ ...searchDateRange });

      const { userContributions } = apiClientResponse;

      for (const userContribution of userContributions) {
        userContribution.documentsContributedToCount = userContribution.ownDocumentsContributedToCount + userContribution.otherDocumentsContributedToCount;
      }

      setAllItems(userContributions);
      setUserContributionsDetailsMap({});
    } finally {
      setIsFetchingItems(false);
    }
  }, [searchDateRange, setIsFetchingItems, statisticsApiClient]);

  const fetchUserContributionsDetails = useCallback(async userId => {
    setUserContributionsDetailsMap(oldValue => ({
      ...oldValue,
      [userId]: { isLoading: true, hasError: false, contributions: null }
    }));
    try {
      const apiClientResponse = await statisticsApiClient.getUserContributionsDetails({ userId, ...searchDateRange });
      const { contributions, documents } = apiClientResponse;
      setUserContributionsDetailsMap(oldValue => ({
        ...oldValue,
        [userId]: { isLoading: false, hasError: false, contributions }
      }));
      setDocumentsMap(oldValue => ({
        ...oldValue,
        ...Object.fromEntries(documents.map(doc => [doc._id, doc]))
      }));
    } catch (error) {
      setUserContributionsDetailsMap(oldValue => ({
        ...oldValue,
        [userId]: { isLoading: false, hasError: true, contributions: null }
      }));
    }
  }, [searchDateRange, statisticsApiClient]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [paging]);

  useEffect(() => {
    history.replaceState(null, '', routes.getStatisticsUrl(TAB.userContributions, {
      ...filtering.query,
      ...sorting.query,
      ...paging.query
    }));
  }, [filtering, sorting, paging]);

  useEffect(() => {
    if (isFetchingItems) {
      return;
    }

    setSearchDateRange(oldRange => {
      const newRange = getDateFilterValuesAsMilliseconds(['contributedFrom', 'contributedUntil']);
      return deepEqual(oldRange, newRange) ? oldRange : newRange;
    });

    const newDisplayedItems = sortItems(filterItems(allItems));

    const newTotals = {
      documentsCreatedCount: 0,
      documentsContributedToCount: 0,
      ownDocumentsContributedToCount: 0,
      otherDocumentsContributedToCount: 0
    };

    for (const item of newDisplayedItems) {
      newTotals.documentsCreatedCount += item.documentsCreatedCount;
      newTotals.documentsContributedToCount += item.documentsContributedToCount;
      newTotals.ownDocumentsContributedToCount += item.ownDocumentsContributedToCount;
      newTotals.otherDocumentsContributedToCount += item.otherDocumentsContributedToCount;
    }

    setTotals(newTotals);
    setDisplayedItems(newDisplayedItems);
    adjustPagingToItems(newDisplayedItems);
  }, [isFetchingItems, allItems, getDateFilterValuesAsMilliseconds, filterItems, sortItems, adjustPagingToItems]);

  const handleExportToCsvButtonClick = async () => {
    const rowPropsToIncludeInCsv = [
      'userDisplayName',
      'documentsContributedToCount',
      'ownDocumentsContributedToCount',
      'otherDocumentsContributedToCount',
      'documentsCreatedCount'
    ];
    const csv = objectsToCsv(displayedItems, rowPropsToIncludeInCsv);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    await httpClient.download(url, 'user-contributions.csv');
    URL.revokeObjectURL(url);
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const renderColumnTitleWithCountSubtitle = ({ title, count = 0, distinct = false }) => {
    return (
      <div className="StatisticsUserContributionsTab-titleCell">
        <div>
          {title}
        </div>
        <div className='StatisticsUserContributionsTab-titleCellSubtitle'>
          ({distinct ? t('distinctCount', { count: formatNumber(count) }) : formatNumber(count)})
        </div>
      </div>
    );
  };

  const renderDocumentLink = documentId => {
    const doc = documentsMap[documentId];
    return (
      <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
    );
  };

  const renderDocumentList = (documentIds, header) => {
    if (!documentIds.length) {
      return null;
    }

    return (
      <Fragment>
        <div className="StatisticsUserContributionsTab-expandedRowHeader">{header}:</div>
        <ul className="StatisticsUserContributionsTab-documentList">
          {documentIds.map(documentId => <li key={documentId}>{renderDocumentLink(documentId)}</li>)}
        </ul>
      </Fragment>
    );
  };

  const renderExpandedRow = ({ userId }) => {
    const entry = userContributionsDetailsMap[userId];
    if (!entry) {
      setTimeout(() => fetchUserContributionsDetails(userId), 0);
    }

    if (!entry || entry.isLoading) {
      return (
        <div className="StatisticsUserContributionsTab-expandedRow StatisticsUserContributionsTab-expandedRow--loading">
          <Spin />
        </div>
      );
    }

    if (entry.hasError) {
      return (
        <div className="StatisticsUserContributionsTab-expandedRow StatisticsUserContributionsTab-expandedRow--error">
          {t('tagDetailsErrorMessage')}
        </div>
      );
    }

    return (
      <div className="StatisticsUserContributionsTab-expandedRow StatisticsUserContributionsTab-expandedRow--data">
        {renderDocumentList(entry.contributions.documentsCreated, t('createdDocumentsCountColumnHeader'))}
        {renderDocumentList(entry.contributions.ownDocumentsContributedTo, t('ownEditedDocumentsCountSortingHeader'))}
        {renderDocumentList(entry.contributions.otherDocumentsContributedTo, t('otherEditedDocumentsCountSortingHeader'))}
      </div>
    );
  };

  const renderUser = (_, item) => {
    const userProfileUrl = routes.getUserProfileUrl(item.userId);
    return (
      <a href={userProfileUrl} className="StatisticsUserContributionsTab-userNameCell">
        {item.userDisplayName}
      </a>
    );
  };

  const tableColumns = [
    {
      title: t('userNameColumnHeader'),
      dataIndex: 'userName',
      key: 'userName',
      render: renderUser
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('createdDocumentsCountColumnHeader'),
        count: totals?.documentsCreatedCount,
        distinct: false
      }),
      dataIndex: 'documentsCreatedCount',
      key: 'documentsCreatedCount',
      render: documentsCreatedCount => formatNumber(documentsCreatedCount),
      align: 'center',
      width: '140px'
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('editedDocumentsCountColumnHeader'),
        count: totals?.documentsContributedToCount,
        distinct: true
      }),
      dataIndex: 'documentsContributedToCount',
      key: 'documentsContributedToCount',
      render: documentsContributedToCount => formatNumber(documentsContributedToCount),
      align: 'center',
      width: '140px'
    },
    {
      title: t('editedDocumentsCategorizedCountColumnHeader'),
      responsive: ['md'],
      align: 'center',
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('ownEditedDocumentsCountColumnHeader'),
            count: totals?.ownDocumentsContributedToCount,
            distinct: true
          }),
          dataIndex: 'ownDocumentsContributedToCount',
          key: 'ownDocumentsContributedToCount',
          render: ownDocumentsContributedToCount => formatNumber(ownDocumentsContributedToCount),
          align: 'center',
          width: '140px'
        },
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('otherEditedDocumentsCountColumnHeader'),
            count: totals?.otherDocumentsContributedToCount,
            distinct: true
          }),
          dataIndex: 'otherDocumentsContributedToCount',
          key: 'otherDocumentsContributedToCount',
          render: otherDocumentsContributedToCount => formatNumber(otherDocumentsContributedToCount),
          align: 'center',
          width: '140px'
        },
      ]
    }
  ];

  return (
    <div className="StatisticsUserContributionsTab">
      <div className="StatisticsUserContributionsTab-filters">
        <FilterInput
          disabled={isFetchingItems}
          value={getTextFilterValue('text')}
          placeholder={t('userNamePlaceholder')}
          className="StatisticsUserContributionsTab-textFilter"
          onChange={event => handleTextFilterChange('text', event.target.value)}
          />
        <RangePicker
          allowClear
          allowEmpty
          format={dateFormat}
          disabled={isFetchingItems}
          disabledDate={determineDisabledDate}
          className="StatisticsUserContributionsTab-contributedDateFilter"
          placeholder={[t('common:fromDate'), t('common:untilDate')]}
          value={getRangePickerFilterValues(['contributedFrom', 'contributedUntil'])}
          onChange={newValues => handleDateRangeFilterChange(['contributedFrom', 'contributedUntil'], newValues)}
          />
        <div className="StatisticsUserContributionsTab-sortingSelector">
          <SortingSelector
            size="large"
            options={sortingSelectorOptions}
            sorting={sorting.sortingSelectorSorting}
            onChange={handleSortingSelectorChange}
            />
        </div>
      </div>
      <div className="StatisticsUserContributionsTab-csvExportButton">
        <Tooltip title={t('exportAsCsv')}>
          <Button
            icon={<TableExportIcon />}
            disabled={isFetchingItems}
            onClick={handleExportToCsvButtonClick}
            />
        </Tooltip>
      </div>
      <Table
        rowKey="userId"
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

export default StatisticsUserContributionsTab;

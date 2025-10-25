import by from 'thenby';
import dayjs from 'dayjs';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { TableExportIcon } from '../icons/icons.js';
import { useService } from '../container-context.js';
import SortingSelector from '../sorting-selector.js';
import { objectsToCsv } from '../../utils/csv-utils.js';
import HttpClient from '../../api-clients/http-client.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { Table, Tag, DatePicker, Button, Tooltip } from 'antd';
import { tokenizeForSearch } from '../../utils/string-utils.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useDateFormat, useNumberFormat } from '../locale-context.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import SearchRequestApiClient from '../../api-clients/search-request-api-client.js';

const { RangePicker } = DatePicker;

const SORTING_VALUE = {
  query: 'query',
  registeredOn: 'registeredOn',
  totalMatchCount: 'totalMatchCount',
  documentMatchCount: 'documentMatchCount',
  mediaLibraryItemMatchCount: 'mediaLibraryItemMatchCount'
};

function createTableRows({ searchRequests }) {
  return searchRequests.map(request => ({
    key: request._id,
    query: request.query,
    registeredOn: request.registeredOn,
    totalMatchCount: request.documentMatchCount + request.mediaLibraryItemMatchCount,
    documentMatchCount: request.documentMatchCount,
    mediaLibraryItemMatchCount: request.mediaLibraryItemMatchCount,
    searchTokens: [...tokenizeForSearch(request.query).allTokens]
  }));
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.searchRequests ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);
  const registeredFromMilliseconds = parseInt((query.registeredFrom || '').trim(), 10);
  const registeredFrom = !isNaN(registeredFromMilliseconds) ? new Date(registeredFromMilliseconds) : null;
  const registeredUntilMilliseconds = parseInt((query.registeredUntil || '').trim(), 10);
  const registeredUntil = !isNaN(registeredUntilMilliseconds) ? new Date(registeredUntilMilliseconds) : null;

  return {
    filter: (query.filter || '').trim(),
    registeredFrom,
    registeredUntil,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10,
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.registeredOn,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
  };
};

function StatisticsSearchRequestsTab() {
  const request = useRequest();
  const formatNumber = useNumberFormat();
  const httpClient = useService(HttpClient);
  const { dateFormat, formatDate } = useDateFormat();
  const { t } = useTranslation('statisticsSearchRequestsTab');
  const searchRequestApiClient = useSessionAwareApiClient(SearchRequestApiClient);

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [searchRequestData, setSearchRequestData] = useState(null);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const [registeredFrom, setContributedFrom] = useState(requestQuery.registeredFrom);
  const [registeredUntil, setContributedUntil] = useState(requestQuery.registeredUntil);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [displayedRowsSum, setDisplayedRowsSum] = useState(null);

  const sortingOptions = useMemo(() => [
    { label: t('query'), appliedLabel: t('sortedByQuery'), value: SORTING_VALUE.query },
    { label: t('registeredOn'), appliedLabel: t('sortedByRegisteredOn'), value: SORTING_VALUE.registeredOn },
    { label: t('totalMatchCount'), appliedLabel: t('sortedByTotalMatchCount'), value: SORTING_VALUE.totalMatchCount },
    { label: t('documentMatchCount'), appliedLabel: t('sortedByDocumentMatchCount'), value: SORTING_VALUE.documentMatchCount },
    { label: t('mediaLibraryItemMatchCount'), appliedLabel: t('sortedByMediaLibraryItemMatchCount'), value: SORTING_VALUE.mediaLibraryItemMatchCount }
  ], [t]);

  const tableSorters = useMemo(() => ({
    [SORTING_VALUE.query]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.query, { direction, ignoreCase: true })),
    [SORTING_VALUE.registeredOn]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.registeredOn, direction)),
    [SORTING_VALUE.totalMatchCount]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.totalMatchCount, direction)),
    [SORTING_VALUE.documentMatchCount]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.documentMatchCount, direction)),
    [SORTING_VALUE.mediaLibraryItemMatchCount]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.mediaLibraryItemMatchCount, direction))
  }), []);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const apiClientResponse = await searchRequestApiClient.getStatisticsSearchRequests({
        registeredFrom,
        registeredUntil
      });

      setSearchRequestData(apiClientResponse);
    } finally {
      setFetchingData(false);
    }
  }, [registeredFrom, registeredUntil, setFetchingData, searchRequestApiClient]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      registeredFrom: registeredFrom?.getTime(),
      registeredUntil: registeredUntil?.getTime(),
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getStatisticsUrl(TAB.searchRequests, queryParams));
  }, [filter, sorting, registeredFrom, registeredUntil, pagination]);

  useEffect(() => {
    (async () => await fetchData())();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(searchRequestData ? createTableRows(searchRequestData) : []);
  }, [searchRequestData]);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase().trim();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.query.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter(filteredRows, sorting.direction);

    const newDisplayedRowsSum = {
      totalMatchCount: 0,
      documentMatchCount: 0,
      mediaLibraryItemMatchCount: 0
    };

    for (const row of filteredRows) {
      newDisplayedRowsSum.totalMatchCount += row.totalMatchCount;
      newDisplayedRowsSum.documentMatchCount += row.documentMatchCount;
      newDisplayedRowsSum.mediaLibraryItemMatchCount += row.mediaLibraryItemMatchCount;
    }

    setDisplayedRows(sortedRows);
    setDisplayedRowsSum(newDisplayedRowsSum);
  }, [allRows, filter, sorting, tableSorters]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleCurrentTableSortingChange = newSorting => {
    setSorting(newSorting);
  };

  const handleDateRangeChange = newDateRange => {
    setContributedFrom(newDateRange ? newDateRange[0].startOf('date').toDate() : null);
    setContributedUntil(newDateRange ? newDateRange[1].endOf('date').toDate() : null);
  };

  const handleExportToCsvButtonClick = async () => {
    const rowPropsToIncludeInCsv = [
      'registeredOn',
      'query',
      'totalMatchCount',
      'documentMatchCount',
      'mediaLibraryItemMatchCount'
    ];
    const csv = objectsToCsv(displayedRows, rowPropsToIncludeInCsv);
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
    return (
      <div className="StatisticsSearchRequestsTab-expandedRow">
        {!!row.searchTokens.length && (
          <Fragment>
            <div className="StatisticsSearchRequestsTab-expandedRowHeader">{t('searchTokens')}:</div>
            <div className="StatisticsSearchRequestsTab-searchTokenList">
              {row.searchTokens.map(token => (
                <Tag className="Tag" key={token}>{token}</Tag>
              ))}
            </div>
          </Fragment>
        )}
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
        count: displayedRowsSum?.totalMatchCount
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
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('documentMatchCountColumnHeader'),
            count: displayedRowsSum?.documentMatchCount
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
            count: displayedRowsSum?.mediaLibraryItemMatchCount
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
      <div className="StatisticsSearchRequestsTab-controls">
        <FilterInput
          size="large"
          value={filter}
          disabled={fetchingData}
          onChange={handleFilterChange}
          placeholder={t('queryPlaceholder')}
          />
        <SortingSelector
          size="large"
          options={sortingOptions}
          sorting={sorting}
          onChange={handleCurrentTableSortingChange}
          />
        <RangePicker
          allowClear
          allowEmpty
          format={dateFormat}
          disabled={fetchingData}
          disabledDate={determineDisabledDate}
          placeholder={[t('common:fromDate'), t('common:untilDate')]}
          value={[
            registeredFrom ? dayjs(registeredFrom) : null,
            registeredUntil ? dayjs(registeredUntil) : null
          ]}
          onChange={handleDateRangeChange}
          />
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
        className="u-table-with-pagination"
        columns={tableColumns}
        dataSource={[...displayedRows]}
        expandable={{ expandedRowRender: renderExpandedRow }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          showSizeChanger: true
        }}
        loading={fetchingData}
        onChange={handleTableChange}
        />
    </div>
  );
}

export default StatisticsSearchRequestsTab;

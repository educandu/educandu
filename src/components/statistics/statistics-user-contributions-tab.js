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
import { Table, DatePicker, Button, Tooltip } from 'antd';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { useDateFormat, useNumberFormat } from '../locale-context.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import DocumentRequestApiClient from '../../api-clients/document-request-api-client.js';

const { RangePicker } = DatePicker;

const SORTING_VALUE = {
  userName: 'userName',
  documentsContributedTo: 'documentsContributedTo',
  ownDocumentsContributedTo: 'ownDocumentsContributedTo',
  otherDocumentsContributedTo: 'otherDocumentsContributedTo',
  documentsCreated: 'documentsCreated'
};

function createTableRows({ userContributionCounters, documents }) {
  const documentsById = new Map(documents.map(doc => [doc._id, doc]));

  return userContributionCounters.map(counter => ({
    key: counter.user._id,
    userId: counter.user._id,
    userName: counter.user.displayName,
    ownDocumentsContributedTo: counter.ownDocumentsContributedTo.map(documentId => documentsById.get(documentId)).sort(by(document => document.title)),
    otherDocumentsContributedTo: counter.otherDocumentsContributedTo.map(documentId => documentsById.get(documentId)).sort(by(document => document.title)),
    documentsCreated: counter.documentsCreated.map(documentId => documentsById.get(documentId)).sort(by(document => document.title)),
    documentsContributedToCount: counter.ownDocumentsContributedTo.length + counter.otherDocumentsContributedTo.length,
    ownDocumentsContributedToCount: counter.ownDocumentsContributedTo.length,
    otherDocumentsContributedToCount: counter.otherDocumentsContributedTo.length,
    documentsCreatedCount: counter.documentsCreated.length
  }));
}

// distinct - verschiedene

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.userContributions ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);
  const contributedFromMilliseconds = parseInt((query.contributedFrom || '').trim(), 10);
  const contributedFrom = !isNaN(contributedFromMilliseconds) ? new Date(contributedFromMilliseconds) : null;
  const contributedUntilMilliseconds = parseInt((query.contributedUntil || '').trim(), 10);
  const contributedUntil = !isNaN(contributedUntilMilliseconds) ? new Date(contributedUntilMilliseconds) : null;

  return {
    filter: (query.filter || '').trim(),
    contributedFrom,
    contributedUntil,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10,
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.documentsContributedTo,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
  };
};

function StatisticsUserContributionsTab() {
  const request = useRequest();
  const { dateFormat } = useDateFormat();
  const formatNumber = useNumberFormat();
  const httpClient = useService(HttpClient);
  const { t } = useTranslation('statisticsUserContributionsTab');
  const documentRequestApiClient = useSessionAwareApiClient(DocumentRequestApiClient);

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [userContributionData, setUserContributionData] = useState(null);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const [contributedFrom, setContributedFrom] = useState(requestQuery.contributedFrom);
  const [contributedUntil, setContributedUntil] = useState(requestQuery.contributedUntil);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [displayedRowsSum, setDisplayedRowsSum] = useState(null);

  const sortingOptions = useMemo(() => [
    { label: t('common:user'), appliedLabel: t('sortedByUserName'), value: SORTING_VALUE.userName },
    { label: t('editedDocumentsCountColumnHeader'), appliedLabel: t('sortedByEditedDocumentsCountColumnHeader'), value: SORTING_VALUE.documentsContributedTo },
    { label: t('ownEditedDocumentsCountSortingHeader'), appliedLabel: t('sortedByOwnEditedDocumentsCountColumnHeader'), value: SORTING_VALUE.ownDocumentsContributedTo },
    { label: t('otherEditedDocumentsCountSortingHeader'), appliedLabel: t('sortedByOtherEditedDocumentsCountColumnHeader'), value: SORTING_VALUE.otherDocumentsContributedTo },
    { label: t('createdDocumentsCountColumnHeader'), appliedLabel: t('sortedByCreatedDocumentsCountColumnHeader'), value: SORTING_VALUE.documentsCreated }
  ], [t]);

  const tableSorters = useMemo(() => ({
    [SORTING_VALUE.userName]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.userName, { direction, ignoreCase: true })),
    [SORTING_VALUE.documentsContributedTo]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.documentsContributedToCount, direction)),
    [SORTING_VALUE.ownDocumentsContributedTo]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.ownDocumentsContributedToCount, direction)),
    [SORTING_VALUE.otherDocumentsContributedTo]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.otherDocumentsContributedToCount, direction)),
    [SORTING_VALUE.documentsCreated]: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.documentsCreatedCount, direction))
  }), []);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      // eslint-disable-next-line no-warning-comments
      // TODO: Create real API client
      let apiClientResponse = await documentRequestApiClient.getStatisticsDocumentRequests({
        contributedFrom,
        contributedUntil,
        daysOfWeek: '1,2,3,4,5,6,7'
      });

      // eslint-disable-next-line no-use-before-define
      apiClientResponse = await getMockServerData();

      setUserContributionData(apiClientResponse);
    } finally {
      setFetchingData(false);
    }
  }, [contributedFrom, contributedUntil, setFetchingData, documentRequestApiClient]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      contributedFrom: contributedFrom?.getTime(),
      contributedUntil: contributedUntil?.getTime(),
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getStatisticsUrl(TAB.userContributions, queryParams));
  }, [filter, sorting, contributedFrom, contributedUntil, pagination]);

  useEffect(() => {
    (async () => await fetchData())();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(userContributionData ? createTableRows(userContributionData) : []);
  }, [userContributionData]);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase().trim();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.userName.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter(filteredRows, sorting.direction);

    const documentsContributedTo = new Set();
    const ownDocumentsContributedTo = new Set();
    const otherDocumentsContributedTo = new Set();
    const documentsCreated = new Set();

    for (const row of filteredRows) {
      row.ownDocumentsContributedTo.forEach(documentId => documentsContributedTo.add(documentId));
      row.otherDocumentsContributedTo.forEach(documentId => documentsContributedTo.add(documentId));
      row.ownDocumentsContributedTo.forEach(documentId => ownDocumentsContributedTo.add(documentId));
      row.otherDocumentsContributedTo.forEach(documentId => otherDocumentsContributedTo.add(documentId));
      row.documentsCreated.forEach(documentId => documentsCreated.add(documentId));
    }

    const newDisplayedRowsSum = {
      documentsContributedToCount: documentsContributedTo.size,
      ownDocumentsContributedToCount: ownDocumentsContributedTo.size,
      otherDocumentsContributedToCount: otherDocumentsContributedTo.size,
      documentsCreatedCount: documentsCreated.size
    };

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
      'userName',
      'documentsContributedToCount',
      'ownDocumentsContributedToCount',
      'otherDocumentsContributedToCount',
      'documentsCreatedCount'
    ];
    const csv = objectsToCsv(displayedRows, rowPropsToIncludeInCsv);
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

  const renderExpandedRow = row => {
    return (
      <div className="StatisticsUserContributionsTab-expandedRow">
        {!!row.ownDocumentsContributedTo.length && (
          <Fragment>
            <div className="StatisticsUserContributionsTab-expandedRowHeader">{t('ownEditedDocumentsCountSortingHeader')}:</div>
            <ul className="StatisticsUserContributionsTab-documentList">
              {row.ownDocumentsContributedTo.map(doc => (
                <li key={doc._id}>
                  <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
        {!!row.otherDocumentsContributedTo.length && (
          <Fragment>
            <div className="StatisticsUserContributionsTab-expandedRowHeader">{t('otherEditedDocumentsCountSortingHeader')}:</div>
            <ul className="StatisticsUserContributionsTab-documentList">
              {row.otherDocumentsContributedTo.map(doc => (
                <li key={doc._id}>
                  <a href={routes.getDocUrl({ id: doc._id, slug: doc.slug })}>{doc.title}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        )}
      </div>
    );
  };

  const tableColumns = [
    {
      title: t('common:user'),
      dataIndex: 'userName',
      key: 'userName'
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('editedDocumentsCountColumnHeader'),
        count: displayedRowsSum?.documentsContributedToCount,
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
      responsive: ['sm'],
      children: [
        {
          title: () => renderColumnTitleWithCountSubtitle({
            title: t('ownEditedDocumentsCountColumnHeader'),
            count: displayedRowsSum?.ownDocumentsContributedToCount,
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
            count: displayedRowsSum?.otherDocumentsContributedToCount,
            distinct: true
          }),
          dataIndex: 'otherDocumentsContributedToCount',
          key: 'otherDocumentsContributedToCount',
          render: otherDocumentsContributedToCount => formatNumber(otherDocumentsContributedToCount),
          align: 'center',
          width: '140px'
        }
      ]
    },
    {
      title: () => renderColumnTitleWithCountSubtitle({
        title: t('createdDocumentsCountColumnHeader'),
        count: displayedRowsSum?.documentsCreatedCount,
        distinct: false
      }),
      responsive: ['sm'],
      dataIndex: 'documentsCreatedCount',
      key: 'documentsCreatedCount',
      render: documentsCreatedCount => formatNumber(documentsCreatedCount),
      align: 'center',
      width: '140px'
    }
  ];

  return (
    <div className="StatisticsUserContributionsTab">
      <div className="StatisticsUserContributionsTab-controls">
        <FilterInput
          size="large"
          value={filter}
          disabled={fetchingData}
          onChange={handleFilterChange}
          placeholder={t('userNamePlaceholder')}
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
          placeholder={[t('fromDatePlaceholder'), t('untilDatePlaceholder')]}
          value={[
            contributedFrom ? dayjs(contributedFrom) : null,
            contributedUntil ? dayjs(contributedUntil) : null
          ]}
          onChange={handleDateRangeChange}
          />
      </div>
      <div className="StatisticsUserContributionsTab-csvExportButton">
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

export default StatisticsUserContributionsTab;

function getMockServerData() {
  return Promise.resolve({
    userContributionCounters: [
      {
        user: {
          _id: 'kGcLsMvaPZasVhe3qTNfYJ',
          displayName: 'umberto'
        },
        ownDocumentsContributedTo: ['4qntc7qz4ot7cq3', '032zr9zgzqot3r'],
        otherDocumentsContributedTo: ['23o8mx87fiuqhfo', '438mhqwqoqmliw'],
        documentsCreated: []
      },
      {
        user: {
          _id: 'kJ5uewTVifrhxH56y7Pgwo',
          displayName: 'user5678'
        },
        ownDocumentsContributedTo: ['4qntc7qz4ot7cq3', '032zr9zgzqot3r'],
        otherDocumentsContributedTo: ['23o8mx87fiuqhfo', '438mhqwqoqmliw'],
        documentsCreated: []
      },
      {
        user: {
          _id: 'GRqak9VhgeFc1FT8Jh7R9e',
          displayName: 'user1213'
        },
        ownDocumentsContributedTo: ['4qntc7qz4ot7cq3', '032zr9zgzqot3r'],
        otherDocumentsContributedTo: ['23o8mx87fiuqhfo', '438mhqwqoqmliw'],
        documentsCreated: ['4qntc7qz4ot7cq3', '032zr9zgzqot3r']
      }
    ],
    documents: [
      {
        _id: '4qntc7qz4ot7cq3',
        title: 'Document 1',
        slug: 'document-1-slug'
      },
      {
        _id: '032zr9zgzqot3r',
        title: 'Document 2',
        slug: 'document-2-slug'
      },
      {
        _id: '23o8mx87fiuqhfo',
        title: 'Document 3',
        slug: 'document-3-slug'
      },
      {
        _id: '438mhqwqoqmliw',
        title: 'Document 4',
        slug: 'document-4-slug'
      }
    ]
  });
}

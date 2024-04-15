import by from 'thenby';
import dayjs from 'dayjs';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { ResetIcon } from '../icons/icons.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { useRequest } from '../request-context.js';
import { useDateFormat } from '../locale-context.js';
import SortingSelector from '../sorting-selector.js';
import { DAY_OF_WEEK } from '../../domain/constants.js';
import { SORTING_DIRECTION, TAB } from './constants.js';
import { replaceItemAt } from '../../utils/array-utils.js';
import { Table, DatePicker, Checkbox, Button } from 'antd';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import DocumentRequestApiClient from '../../api-clients/document-request-api-client.js';

const { RangePicker } = DatePicker;

const SORTING_VALUE = {
  totalCount: 'totalCount',
  readCount: 'readCount',
  writeCount: 'writeCount',
  anonymousCount: 'anonymousCount',
  loggedInCount: 'loggedInCount'
};

const getDefaultSortingPair = () => [SORTING_VALUE.totalCount, SORTING_DIRECTION.desc];

function createTableRows(documentsWithCounters) {
  return documentsWithCounters.map(documentWithCounters => ({
    _id: documentWithCounters._id,
    key: documentWithCounters._id,
    documentId: documentWithCounters._id,
    title: documentWithCounters.title,
    createdOn: documentWithCounters.createdOn,
    updatedOn: documentWithCounters.updatedOn,
    createdBy: documentWithCounters.createdBy,
    totalCount: documentWithCounters.totalCount,
    readCount: documentWithCounters.readCount,
    writeCount: documentWithCounters.writeCount,
    anonymousCount: documentWithCounters.anonymousCount,
    loggedInCount: documentWithCounters.loggedInCount,
  }));
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.requests ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);
  const registeredFromMilliseconds = parseInt((query.registeredFrom || '').trim(), 10);
  const registeredFrom = !isNaN(registeredFromMilliseconds) ? new Date(registeredFromMilliseconds) : null;
  const registeredUntilMilliseconds = parseInt((query.registeredUntil || '').trim(), 10);
  const registeredUntil = !isNaN(registeredUntilMilliseconds) ? new Date(registeredUntilMilliseconds) : null;
  const daysOfWeek = query.daysOfWeek ? query.daysOfWeek.trim().split(',').map(text => Number(text)) : Object.values(DAY_OF_WEEK);
  const sortingPairTexts = query.sortingPairs ? query.sortingPairs.trim().split(',') : [];
  const sortingPairs = sortingPairTexts
    .map(pairText => pairText.split('_'))
    .filter(pair => Object.values(SORTING_VALUE).includes(pair[0]) && Object.values(SORTING_DIRECTION).includes(pair[1]));

  return {
    filter: (query.filter || '').trim(),
    registeredFrom,
    registeredUntil,
    daysOfWeek,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10,
    sortingPairs: sortingPairs.length ? sortingPairs : [getDefaultSortingPair()]
  };
};

function MaintenanceRequestsTab() {
  const request = useRequest();
  const { dateFormat } = useDateFormat();
  const { t } = useTranslation('maintenanceRequestsTab');
  const documentRequestApiClient = useSessionAwareApiClient(DocumentRequestApiClient);

  const daysOfWeekOptions = [
    { label: t('mondayCheckbox'), value: DAY_OF_WEEK.monday },
    { label: t('tuesdayCheckbox'), value: DAY_OF_WEEK.tuesday },
    { label: t('wednesdayCheckbox'), value: DAY_OF_WEEK.wednesday },
    { label: t('thursdayCheckbox'), value: DAY_OF_WEEK.thursday },
    { label: t('fridayCheckbox'), value: DAY_OF_WEEK.friday },
    { label: t('saturdayCheckbox'), value: DAY_OF_WEEK.saturday },
    { label: t('sundayCheckbox'), value: DAY_OF_WEEK.sunday }
  ];

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [daysOfWeek, setDaysOfWeek] = useState(requestQuery.daysOfWeek);
  const [documentRequestCounters, setDocumentRequestCounters] = useState([]);
  const [sortingPairs, setSortingPairs] = useState(requestQuery.sortingPairs);
  const [registeredFrom, setRegisteredFrom] = useState(requestQuery.registeredFrom);
  const [registeredUntil, setRegisteredUntil] = useState(requestQuery.registeredUntil);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);

  const sortingOptions = useMemo(() => [
    { label: t('totalCountColumnHeader'), appliedLabel: t('sortedByTotalCount'), value: SORTING_VALUE.totalCount },
    { label: t('readCountColumnHeader'), appliedLabel: t('sortedByReadCount'), value: SORTING_VALUE.readCount },
    { label: t('writeCountColumnHeader'), appliedLabel: t('sortedByWriteCount'), value: SORTING_VALUE.writeCount },
    { label: t('anonymousCountColumnHeader'), appliedLabel: t('sortedByAnonymousCount'), value: SORTING_VALUE.anonymousCount },
    { label: t('loggedInCountColumnHeader'), appliedLabel: t('sortedByLoggedInCount'), value: SORTING_VALUE.loggedInCount }
  ], [t]);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const apiClientResponse = await documentRequestApiClient.getMaintenanceDocumentRequests({ registeredFrom, registeredUntil, daysOfWeek });
      setDocumentRequestCounters(apiClientResponse.documentRequestCounters);
    } finally {
      setFetchingData(false);
    }
  }, [registeredFrom, registeredUntil, daysOfWeek, setFetchingData, documentRequestApiClient]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      registeredFrom: registeredFrom?.getTime(),
      registeredUntil: registeredUntil?.getTime(),
      daysOfWeek,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortingPairs: sortingPairs.map(pair => pair.join('_')).join(',')
    };

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.requests, queryParams));
  }, [filter, sortingPairs, registeredFrom, registeredUntil, daysOfWeek, pagination]);

  useEffect(() => {
    (async () => await fetchData())();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(createTableRows(documentRequestCounters));
  }, [documentRequestCounters]);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase().trim();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.title.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    const sorters = sortingPairs.reduce((chain, sortingPair, sortingPairIndex) => {
      return sortingPairIndex === 0
        ? by(row => row[sortingPair[0]], sortingPair[1])
        : chain.thenBy(row => row[sortingPair[0]], sortingPair[1]);
    }, null);

    const sortedRows = [...filteredRows].sort(sorters);

    setDisplayedRows(sortedRows);
  }, [allRows, filter, sortingPairs]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleSortingPairChange = (sortingPairIndex, { value, direction }) => {
    const newSortingPairs = replaceItemAt(sortingPairs, [value, direction], sortingPairIndex);
    setSortingPairs(newSortingPairs);
  };

  const handleAddSorterClick = () => {
    setSortingPairs([...sortingPairs, getDefaultSortingPair()]);
  };

  const handleResetSortersClick = () => {
    setSortingPairs([getDefaultSortingPair()]);
  };

  const handleDateRangeChange = newDateRange => {
    setRegisteredFrom(newDateRange ? newDateRange[0].startOf('date').toDate() : null);
    setRegisteredUntil(newDateRange ? newDateRange[1].endOf('date').toDate() : null);
  };

  const handleDaysOfWeekChange = newCheckedValues => {
    if (newCheckedValues.length >= 1) {
      setDaysOfWeek(newCheckedValues);
    }
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const renderDocumentTitle = (_title, row) => {
    const documentWithCounters = documentRequestCounters.find(d => d._id === row.documentId);
    if (!documentWithCounters) {
      return null;
    }

    const documentUrl = routes.getDocUrl({ id: documentWithCounters._id, slug: documentWithCounters.slug });

    return (
      <a href={documentUrl} className="MaintenanceRequestsTab-titleCell">
        {_title}
      </a>
    );
  };

  const columns = [
    {
      title: t('common:document'),
      dataIndex: 'title',
      key: 'title',
      render: renderDocumentTitle
    },
    {
      title: t('totalCountColumnHeader'),
      dataIndex: 'totalCount',
      key: 'totalCount',
      render: _totalCount => _totalCount,
      align: 'center',
      width: '100px'
    },
    {
      title: t('requestColumnHeader'),
      responsive: ['sm'],
      children: [
        {
          title: t('readCountColumnHeader'),
          dataIndex: 'readCount',
          key: 'readCount',
          render: _readCount => _readCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('writeCountColumnHeader'),
          dataIndex: 'writeCount',
          key: 'writeCount',
          render: _writeCount => _writeCount,
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
          title: t('anonymousCountColumnHeader'),
          dataIndex: 'anonymousCount',
          key: 'anonymousCount',
          render: _anonymousCount => _anonymousCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('loggedInCountColumnHeader'),
          dataIndex: 'loggedInCount',
          key: 'loggedInCount',
          render: _loggedInCount => _loggedInCount,
          align: 'center',
          width: '100px'
        }
      ]
    }
  ];

  const canAddSorter = sortingPairs.length < Object.values(SORTING_VALUE).length;

  return (
    <div className="MaintenanceRequestsTab">
      <div className="MaintenanceRequestsTab-controls">
        <div className="MaintenanceRequestsTab-controlsColumn">
          <FilterInput
            size="large"
            value={filter}
            disabled={fetchingData}
            onChange={handleFilterChange}
            placeholder={t('titlePlaceholder')}
            />
          <div className="MaintenanceRequestsTab-controlsColumnFilters">
            <RangePicker
              allowClear
              format={dateFormat}
              disabled={fetchingData}
              disabledDate={determineDisabledDate}
              placeholder={[t('fromDatePlaceholder'), t('untilDatePlaceholder')]}
              value={[
                registeredFrom ? dayjs(registeredFrom) : null,
                registeredUntil ? dayjs(registeredUntil) : null
              ]}
              onChange={handleDateRangeChange}
              />
            <Checkbox.Group
              value={daysOfWeek}
              disabled={fetchingData}
              options={daysOfWeekOptions}
              className='MaintenanceRequestsTab-controlsColumnCheckboxes'
              onChange={handleDaysOfWeekChange}
              />
          </div>
        </div>
        <div>
          {sortingPairs.map((sortingPair, sortingPairIndex) => (
            <Fragment key={sortingPairIndex}>
              {sortingPairIndex > 0 && (
                <div className='MaintenanceRequestsTab-sortersSaparator'>
                  {t('sortersJoiningText')}
                </div>
              )}
              <SortingSelector
                size="large"
                sorting={{ value: sortingPair[0], direction: sortingPair[1] }}
                options={sortingOptions}
                onChange={data => handleSortingPairChange(sortingPairIndex, data)}
                />
            </Fragment>
          )
          )}
          <div className="MaintenanceRequestsTab-sorterButtons">
            <Button
              size="small"
              disabled={!canAddSorter}
              icon={<PlusOutlined />}
              onClick={handleAddSorterClick}
              >
              {t('addSorterButton')}
            </Button>
            <Button
              size="small"
              icon={<ResetIcon />}
              onClick={handleResetSortersClick}
              >
              {t('resetSortersButton')}
            </Button>
          </div>
        </div>
      </div>
      <Table
        dataSource={[...displayedRows]}
        columns={columns}
        className="u-table-with-pagination"
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

export default MaintenanceRequestsTab;

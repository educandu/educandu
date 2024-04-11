import by from 'thenby';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { Table, DatePicker, Checkbox } from 'antd';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import { useDateFormat } from '../locale-context.js';
import { DAY_OF_WEEK } from '../../domain/constants.js';
import { documentWithRequestCountersShape } from '../../ui/default-prop-types.js';

const { RangePicker } = DatePicker;

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

  return {
    filter: (query.filter || '').trim(),
    registeredFrom,
    registeredUntil,
    daysOfWeek,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function MaintenanceRequestsTab({ fetchingData, documentsWithRequestCounters }) {
  const request = useRequest();
  const { dateFormat } = useDateFormat();
  const { t } = useTranslation('maintenanceRequestsTab');

  const requestQuery = getSanitizedQueryFromRequest(request);
  const daysOfWeekOptions = [
    { label: t('mondayCheckbox'), value: DAY_OF_WEEK.monday },
    { label: t('tuesdayCheckbox'), value: DAY_OF_WEEK.tuesday },
    { label: t('wednesdayCheckbox'), value: DAY_OF_WEEK.wednesday },
    { label: t('thursdayCheckbox'), value: DAY_OF_WEEK.thursday },
    { label: t('fridayCheckbox'), value: DAY_OF_WEEK.friday },
    { label: t('saturdayCheckbox'), value: DAY_OF_WEEK.saturday },
    { label: t('sundayCheckbox'), value: DAY_OF_WEEK.sunday }
  ];

  const [filter, setFilter] = useState(requestQuery.filter);
  const [daysOfWeek, setDaysOfWeek] = useState(requestQuery.daysOfWeek);
  const [registeredFrom, setRegisteredFrom] = useState(requestQuery.registeredFrom);
  const [registeredUntil, setRegisteredUntil] = useState(requestQuery.registeredUntil);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const [renderingRows, setRenderingRows] = useState(!!documentsWithRequestCounters.length);

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
      pageSize: pagination.pageSize
    };

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.requests, queryParams));
  }, [filter, registeredFrom, registeredUntil, daysOfWeek, pagination]);

  useEffect(() => {
    setAllRows(createTableRows(documentsWithRequestCounters));
  }, [documentsWithRequestCounters]);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase().trim();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.title.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    setRenderingRows(!!filteredRows.length);
    setDisplayedRows(filteredRows.sort(by(row => row.createdOn, { direction: 'desc' })));
  }, [allRows, filter]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleDateRangeChange = newDateRange=> {
    setRegisteredFrom(newDateRange ? newDateRange[0].startOf('date').toDate() : null);
    setRegisteredUntil(newDateRange ? newDateRange[1].startOf('date').toDate() : null);
  };

  const handleDaysOfWeekChange = newCheckedValues => {
    if (newCheckedValues.length >= 1) {
      setDaysOfWeek(newCheckedValues);
    }
  };

  const handleRowRendered = (record, rowIndex) => {
    const indexOfLastRecordOnPage = Math.min(displayedRows.length - 1, pagination.pageSize - 1);

    if (rowIndex === indexOfLastRecordOnPage) {
      const delayToAvoidRerenderingClash = 100;
      setTimeout(() => setRenderingRows(false), delayToAvoidRerenderingClash);
    }
    return {};
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const renderDocumentTitle = (_title, row) => {
    const documentWithCounters = documentsWithRequestCounters.find(d => d._id === row.documentId);
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
      title: t('totalColumnHeader'),
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
          title: t('readColumnHeader'),
          dataIndex: 'readCount',
          key: 'readCount',
          render: _readCount => _readCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('writeColumnHeader'),
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
          title: t('anonymousColumnHeader'),
          dataIndex: 'anonymousCount',
          key: 'anonymousCount',
          render: _anonymousCount => _anonymousCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('loggedInColumnHeader'),
          dataIndex: 'loggedInCount',
          key: 'loggedInCount',
          render: _loggedInCount => _loggedInCount,
          align: 'center',
          width: '100px'
        }
      ]
    }
  ];

  return (
    <div className="MaintenanceRequestsTab">
      <div className="MaintenanceRequestsTab-controls">
        <div className="MaintenanceRequestsTab-controlsColumn">
          <FilterInput
            size="large"
            value={filter}
            onChange={handleFilterChange}
            placeholder={t('titlePlaceholder')}
            />
          <div className="MaintenanceRequestsTab-controlsColumnFilters">
            <RangePicker
              allowClear
              format={dateFormat}
              disabledDate={determineDisabledDate}
              className='MaintenanceRequestsTab-controlsColumnFiltersDateRange'
              placeholder={[t('fromDatePlaceholder'), t('untilDatePlaceholder')]}
              value={[
                registeredFrom ? dayjs(registeredFrom) : null,
                registeredUntil ? dayjs(registeredUntil) : null
              ]}
              onChange={handleDateRangeChange}
              />
            <Checkbox.Group
              value={daysOfWeek}
              options={daysOfWeekOptions}
              onChange={handleDaysOfWeekChange}
              />
          </div>
        </div>
        <div className="MaintenanceRequestsTab-controlsColumn">
          <div>[Sorting by 1]</div>
          <div>[Sorting by 2]</div>
          <div>[Sorting by 3]</div>
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
        loading={fetchingData || renderingRows}
        onRow={handleRowRendered}
        onChange={handleTableChange}
        />
    </div>
  );
}

MaintenanceRequestsTab.propTypes = {
  fetchingData: PropTypes.bool.isRequired,
  documentsWithRequestCounters: PropTypes.arrayOf(documentWithRequestCountersShape).isRequired,
};

export default MaintenanceRequestsTab;

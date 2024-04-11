import by from 'thenby';
import { Table } from 'antd';
import PropTypes from 'prop-types';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import { documentWithRequestCountersShape } from '../../ui/default-prop-types.js';

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

  return {
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function MaintenanceRequestsTab({ fetchingData, documentsWithRequestCounters }) {
  const request = useRequest();
  const { t } = useTranslation('maintenanceRequestsTab');

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const [renderingRows, setRenderingRows] = useState(!!documentsWithRequestCounters.length);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.requests, queryParams));
  }, [pagination]);

  useEffect(() => {
    setAllRows(createTableRows(documentsWithRequestCounters));
  }, [documentsWithRequestCounters]);

  useEffect(() => {
    setRenderingRows(!!allRows.length);
    setDisplayedRows(allRows.sort(by(row => row.createdOn, { direction: 'desc' })));
  }, [allRows]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleRowRendered = (record, rowIndex) => {
    const indexOfLastRecordOnPage = Math.min(displayedRows.length - 1, pagination.pageSize - 1);

    if (rowIndex === indexOfLastRecordOnPage) {
      const delayToAvoidRerenderingClash = 100;
      setTimeout(() => setRenderingRows(false), delayToAvoidRerenderingClash);
    }
    return {};
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
      title: t('total'),
      dataIndex: 'totalCount',
      key: 'totalCount',
      render: _totalCount => _totalCount,
      align: 'center',
      width: '100px'
    },
    {
      title: t('request'),
      responsive: ['sm'],
      children: [
        {
          title: t('read'),
          dataIndex: 'readCount',
          key: 'readCount',
          render: _readCount => _readCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('write'),
          dataIndex: 'writeCount',
          key: 'writeCount',
          render: _writeCount => _writeCount,
          align: 'center',
          width: '100px'
        }
      ]
    },
    {
      title: t('user'),
      responsive: ['md'],
      children: [
        {
          title: t('anonymous'),
          dataIndex: 'anonymousCount',
          key: 'anonymousCount',
          render: _anonymousCount => _anonymousCount,
          align: 'center',
          width: '100px'
        },
        {
          title: t('loggedIn'),
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

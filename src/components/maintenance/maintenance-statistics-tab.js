import { Table } from 'antd';
import PropTypes from 'prop-types';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import React, { useEffect, useState } from 'react';
import ResourceTitleCell from '../resource-title-cell.js';
import { documentWithRequestCountersShape } from '../../ui/default-prop-types.js';

function createTableRows(docs) {
  return docs.map(doc => ({
    key: doc._id,
    _id: doc._id,
    documentId: doc._id,
    title: doc.title,
    createdOn: doc.createdOn,
    updatedOn: doc.updatedOn,
    createdBy: doc.createdBy,
  }));
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.statistics ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function MaintenanceStatisticsTab({ fetchingData, documentsWithRequestCounters }) {
  const request = useRequest();
  const { t } = useTranslation('maintenanceStatisticsTab');

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

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.statistics, queryParams));
  }, [pagination]);

  useEffect(() => {
    setAllRows(createTableRows(documentsWithRequestCounters));
  }, [documentsWithRequestCounters]);

  useEffect(() => {
    setRenderingRows(!!allRows.length);
    setDisplayedRows(allRows);
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
    const doc = documentsWithRequestCounters.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return (
      <ResourceTitleCell
        title={doc.title}
        shortDescription={doc.shortDescription}
        url={routes.getDocUrl({ id: doc._id, slug: doc.slug })}
        createdOn={doc.createdOn}
        createdBy={doc.createdBy}
        updatedOn={doc.updatedOn}
        updatedBy={doc.updatedBy}
        />
    );
  };

  const columns = [
    {
      title: t('common:document'),
      dataIndex: 'title',
      key: 'title',
      render: renderDocumentTitle
    }
  ];

  return (
    <div className="MaintenanceStatisticsTab">
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

MaintenanceStatisticsTab.propTypes = {
  fetchingData: PropTypes.bool.isRequired,
  documentsWithRequestCounters: PropTypes.arrayOf(documentWithRequestCountersShape).isRequired,
};

export default MaintenanceStatisticsTab;

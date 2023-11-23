import PropTypes from 'prop-types';
import { Tabs, Table } from 'antd';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { BankOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { useDateFormat } from '../locale-context.js';
import ResourceInfoCell from '../resource-info-cell.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import RecentContributionsApiClient from '../../api-clients/recent-contributions-api-client.js';

const TAB = {
  documents: 'documents',
  mediaLibrary: 'media-library'
};

const determineTab = query => Object.values(TAB).find(val => val === query) || Object.keys(TAB)[0];

const getSanitizedQueryFromRequest = request => {
  const query = request.query || {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function RecentContributions({ PageTemplate }) {
  const request = useRequest();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('recentContributions');
  const recentContributionsApiClient = useSessionAwareApiClient(RecentContributionsApiClient);

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [documents, setDocuments] = useState([]);
  const [tab, setTab] = useState(determineTab(request.query.tab));
  const [fetchingDocuments, setFetchingDocuments] = useState(false);
  const [documentsTotalCount, setDocumentsTotalCount] = useState(0);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });

  useEffect(() => {
    (async () => {
      setFetchingDocuments(true);
      const response = await recentContributionsApiClient.getDocuments({ ...pagination });
      setDocuments(response.documents);
      setDocumentsTotalCount(response.documentsTotalCount);
      setFetchingDocuments(false);
      history.replaceState(null, '', routes.getRecentContributionsUrl({ tab, ...pagination }));
    })();
  }, [tab, pagination, recentContributionsApiClient]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const renderDocumentTitle = (_title, docRow) => {
    return (
      <ResourceInfoCell
        title={docRow.title}
        shortDescription={docRow.shortDescription}
        subtext={
          <div className="MaintenanceDocumentsTab-titleSubtext">
            <div>
              <span>{`${t('common:createdOnDateBy', { date: formatDate(docRow.createdOn) })} `}</span>
              <a href={routes.getUserProfileUrl(docRow.createdBy._id)}>{docRow.createdBy.displayName}</a>
            </div>
            <div>
              <span>{`${t('common:updatedOnDateBy', { date: formatDate(docRow.updatedOn) })} `}</span>
              <a href={routes.getUserProfileUrl(docRow.updatedBy._id)}>{docRow.updatedBy.displayName}</a>
            </div>
          </div>
        }
        url={routes.getDocUrl({ id: docRow._id, slug: docRow.slug })}
        />
    );
  };

  const documentTableColumns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderDocumentTitle
    }
  ];

  const tabsItems = [
    {
      key: TAB.documents,
      label: <div><FileIcon />{t('documentsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <Table
            rowKey="_id"
            className="u-table-with-pagination"
            dataSource={[...documents]}
            columns={documentTableColumns}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: documentsTotalCount,
              showSizeChanger: true
            }}
            loading={fetchingDocuments}
            onChange={handleTableChange}
            />
        </div>
      )
    },
    {
      key: TAB.mediaLibrary,
      label: <div><BankOutlined />{t('mediaLibraryTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane" />
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="RecentContributionsPage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:recentContributions')}</h1>
        <div className="u-page-subtitle">{t('pageSubtitle')}</div>
        <Tabs
          type="line"
          size="middle"
          className="Tabs"
          items={tabsItems}
          activeKey={tab}
          onChange={setTab}
          />
      </div>
    </PageTemplate>
  );
}

RecentContributions.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default RecentContributions;

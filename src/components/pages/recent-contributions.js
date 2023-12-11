import PropTypes from 'prop-types';
import { Tabs, Table } from 'antd';
import routes from '../../utils/routes.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { BankOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import ResourceTypeCell from '../resource-type-cell.js';
import ResourceTitleCell from '../resource-title-cell.js';
import DocumentBadgesCell from '../document-bagdes-cell.js';
import { SEARCH_RESOURCE_TYPE } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import RecentContributionsApiClient from '../../api-clients/recent-contributions-api-client.js';

const TAB = {
  documents: 'documents',
  mediaLibraryItems: 'media-library-items'
};

const DEFAULT_PAGE_SIZE = 10;

const determineTab = query => Object.values(TAB).find(val => val === query) || Object.keys(TAB)[0];

const getSanitizedQueryFromRequest = request => {
  const query = request.query || {};
  const tab = determineTab(query.tab);

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    tab,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : DEFAULT_PAGE_SIZE
  };
};

function RecentContributions({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('recentContributions');
  const recentContributionsApiClient = useSessionAwareApiClient(RecentContributionsApiClient);

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [tab, setTab] = useState(requestQuery.tab);
  const [pagination, setPagination] = useState({
    page: requestQuery.page,
    pageSize: requestQuery.pageSize
  });

  const [documents, setDocuments] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);
  const [mediaLibraryItems, setMediaLibraryItems] = useState([]);
  const [documentsTotalCount, setDocumentsTotalCount] = useState(0);
  const [mediaLibraryItemsTotalCount, setMediaLibraryItemsTotalCount] = useState(0);

  useEffect(() => {
    (async () => {
      setFetchingData(true);
      history.replaceState(null, '', routes.getRecentContributionsUrl({ tab, ...pagination }));

      if (tab === TAB.documents) {
        const response = await recentContributionsApiClient.getDocuments({ ...pagination });
        setDocuments(response.documents);
        setDocumentsTotalCount(response.documentsTotalCount);
      }

      if (tab === TAB.mediaLibraryItems) {
        const response = await recentContributionsApiClient.getMediaLibraryItems({ ...pagination });
        setMediaLibraryItems(response.mediaLibraryItems);
        setMediaLibraryItemsTotalCount(response.mediaLibraryItemsTotalCount);
      }

      setFetchingData(false);
    })();
  }, [tab, pagination, recentContributionsApiClient]);

  const handleTabChange = newTab => {
    setPagination({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
    setTab(newTab);
  };

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const renderDocumentType = () => (
    <ResourceTypeCell searchResourceType={SEARCH_RESOURCE_TYPE.document} />
  );

  const renderDocumentTitle = (_title, docRow) => (
    <ResourceTitleCell
      title={docRow.title}
      shortDescription={docRow.shortDescription}
      url={routes.getDocUrl({ id: docRow._id, slug: docRow.slug })}
      createdOn={docRow.createdOn}
      createdBy={docRow.createdBy}
      updatedOn={docRow.updatedOn}
      updatedBy={docRow.updatedBy}
      />
  );

  const renderDocumentBadges = (_, docRow) => (
    <DocumentBadgesCell publicContext={docRow.publicContext} />
  );

  const renderMediaLibraryItemType = (_, mediaLibraryItemRow) => (
    <ResourceTypeCell searchResourceType={mediaLibraryItemRow.resourceType} />
  );

  const renderMediaLibraryItemName = (_, mediaLibraryItemRow) => {
    return (
      <ResourceTitleCell
        title={mediaLibraryItemRow.name}
        shortDescription={mediaLibraryItemRow.shortDescription}
        url={routes.getMediaLibraryItemUrl(mediaLibraryItemRow._id)}
        createdOn={mediaLibraryItemRow.createdOn}
        createdBy={mediaLibraryItemRow.createdBy}
        updatedOn={mediaLibraryItemRow.updatedOn}
        updatedBy={mediaLibraryItemRow.updatedBy}
        />
    );
  };

  const renderTagsOrLicenses = tagsOrLicenses => (
    <TagsExpander tags={tagsOrLicenses} />
  );

  const documentTableColumns = [
    {
      title: t('common:type'),
      key: 'type',
      render: renderDocumentType,
      width: '60px'
    },
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderDocumentTitle
    },
    {
      title: t('common:tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: renderTagsOrLicenses,
      responsive: ['lg'],
      width: '300px'
    },
    {
      title: t('common:badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderDocumentBadges,
      responsive: ['md'],
      width: '150px'
    }
  ];

  const mediaLibraryItemsTableColumns = [
    {
      title: t('common:type'),
      key: 'type',
      render: renderMediaLibraryItemType,
      width: '60px'
    },
    {
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
      render: renderMediaLibraryItemName
    },
    {
      title: t('common:tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: renderTagsOrLicenses,
      responsive: ['lg'],
      width: '300px'
    },
    {
      title: t('common:licenses'),
      dataIndex: 'licenses',
      key: 'licenses',
      render: renderTagsOrLicenses,
      responsive: ['md'],
      width: '150px'
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
            dataSource={[...documents]}
            columns={documentTableColumns}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: documentsTotalCount,
              showSizeChanger: true
            }}
            loading={fetchingData}
            onChange={handleTableChange}
            />
        </div>
      )
    },
    {
      key: TAB.mediaLibraryItems,
      label: <div><BankOutlined />{t('mediaLibraryTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <Table
            rowKey="_id"
            dataSource={[...mediaLibraryItems]}
            columns={mediaLibraryItemsTableColumns}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: mediaLibraryItemsTotalCount,
              showSizeChanger: true
            }}
            loading={fetchingData}
            onChange={handleTableChange}
            />
        </div>
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
          onChange={handleTabChange}
          />
      </div>
    </PageTemplate>
  );
}

RecentContributions.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default RecentContributions;

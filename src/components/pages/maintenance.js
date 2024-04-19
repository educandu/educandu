import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { TAB } from '../maintenance/constants.js';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import MaintenanceTagsTab from '../maintenance/maintenance-tags-tab.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import MaintenanceDocumentsTab from '../maintenance/maintenance-documents-tab.js';
import { CategoryIcon, ClickIcon, MediaLibraryIcon, TagIcon } from '../icons/icons.js';
import MaintenanceMediaLibraryTab from '../maintenance/maintenance-media-library-tab.js';
import MaintenanceDocumentRequestsTab from '../maintenance/maintenance-document-requests-tab.js';
import MaintenanceDocumentCategoriesTab from '../maintenance/maintenance-document-categories-tab.js';

const determineTab = query => Object.values(TAB)
  .find(val => val === query) || Object.keys(TAB)[0];

function Maintenance({ PageTemplate }) {
  const request = useRequest();

  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const { t } = useTranslation('maintenance');
  const [documents, setDocuments] = useState([]);
  const [mediaLibraryItems, setMediaLibraryItems] = useState([]);
  const [fetchingTags, setFetchingTags] = useDebouncedFetchingState(true);
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));
  const [fetchingDocuments, setFetchingDocuments] = useDebouncedFetchingState(true);
  const [fetchingMediaLibraryItems, setFetchingMediaLibraryItems] = useDebouncedFetchingState(true);

  const handleTabChange = tab => {
    setCurrentTab(tab);
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setFetchingDocuments(true);
      const apiClientResponse = await documentApiClient.getMaintenanceDocuments();
      setDocuments(apiClientResponse.documents);
    } finally {
      setFetchingDocuments(false);
    }
  }, [setFetchingDocuments, documentApiClient]);

  const fetchMediaLibraryItems = useCallback(async () => {
    try {
      setFetchingMediaLibraryItems(true);
      const apiClientResponse = await mediaLibraryApiClient.getMaintenanceMediaLibraryItems();
      setMediaLibraryItems(apiClientResponse.mediaLibraryItems);
    } finally {
      setFetchingMediaLibraryItems(false);
    }
  }, [setFetchingMediaLibraryItems, mediaLibraryApiClient]);

  const fetchTags = useCallback(async () => {
    try {
      setFetchingTags(true);

      const [documentApiResponse, mediaLibraryApiResponse] = await Promise.all([
        documentApiClient.getMaintenanceDocuments(),
        mediaLibraryApiClient.getMaintenanceMediaLibraryItems()
      ]);

      setDocuments(documentApiResponse.documents);
      setMediaLibraryItems(mediaLibraryApiResponse.mediaLibraryItems);
    } finally {
      setFetchingTags(false);
    }
  }, [setFetchingTags, documentApiClient, mediaLibraryApiClient]);

  useEffect(() => {
    (async () => {
      switch (currentTab) {
        case TAB.documents:
          await fetchDocuments();
          break;
        case TAB.mediaLibrary:
          await fetchMediaLibraryItems();
          break;
        case TAB.tags:
          await fetchTags();
          break;
        default:
          break;
      }
    })();
  }, [currentTab, fetchDocuments, fetchMediaLibraryItems, fetchTags]);

  const tabItems = [
    {
      key: TAB.documents,
      label: <div><FileIcon />{t('documentsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentsTab fetchingData={fetchingDocuments} documents={documents} onDocumentsChange={setDocuments} />
        </div>
      )
    },
    {
      key: TAB.mediaLibrary,
      label: <div><MediaLibraryIcon />{t('mediaLibraryTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceMediaLibraryTab fetchingData={fetchingMediaLibraryItems} mediaLibraryItems={mediaLibraryItems} onMediaLibraryItemsChange={setMediaLibraryItems} />
        </div>
      )
    },
    {
      key: TAB.tags,
      label: <div><TagIcon />{t('tagsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceTagsTab fetchingData={fetchingTags} documents={documents} mediaLibraryItems={mediaLibraryItems} />
        </div>
      )
    },
    {
      key: TAB.documentRequests,
      label: <div><ClickIcon />{t('documentRequestsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentRequestsTab />
        </div>
      )
    },
    {
      key: TAB.documentCategories,
      label: <div><CategoryIcon />{t('documentCategoriesTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentCategoriesTab />
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="MaintenancePage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:maintenance')}</h1>
        <div className="u-page-subtitle">{t('pageSubtitle')}</div>
        <Tabs
          type="line"
          size="middle"
          className="Tabs"
          items={tabItems}
          activeKey={currentTab}
          destroyInactiveTabPane
          onChange={handleTabChange}
          />
      </div>
    </PageTemplate>
  );
}

Maintenance.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Maintenance;

import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TABS } from '../maintenance/constants.js';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { BankOutlined, TagOutlined } from '@ant-design/icons';
import MaintenanceTagsTab from '../maintenance/maintenance-tags-tab.js';
import MaintenanceDocumentsTab from '../maintenance/maintenance-documents-tab.js';
import MaintenanceMediaLibraryTab from '../maintenance/maintenance-media-library-tab.js';
import { documentExtendedMetadataShape, mediaLibraryItemShape } from '../../ui/default-prop-types.js';

const determineTab = query => Object.values(TABS).find(val => val === query) || Object.keys(TABS)[0];

function Maintenance({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('maintenance');
  const [documents, setDocuments] = useState(initialState.documents);
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));
  const [mediaLibraryItems, setMediaLibraryItems] = useState(initialState.mediaLibraryItems);

  const changeTab = tab => {
    setCurrentTab(tab);
  };

  const handleTabChange = newKey => {
    changeTab(newKey);
  };

  const tabItems = [
    {
      key: TABS.documents,
      label: <div><FileIcon />{t('documentsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentsTab documents={documents} onDocumentsChange={setDocuments} />
        </div>
      )
    },
    {
      key: TABS.mediaLibrary,
      label: <div><BankOutlined />{t('mediaLibraryTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceMediaLibraryTab mediaLibraryItems={mediaLibraryItems} onMediaLibraryItemsChange={setMediaLibraryItems} />
        </div>
      )
    },
    {
      key: TABS.tags,
      label: <div><TagOutlined />{t('tagsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceTagsTab documents={documents} mediaLibraryItems={mediaLibraryItems} />
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="MaintenancePage">
        <h1 className="u-page-title">{t('pageNames:maintenance')}</h1>
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
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
    mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired
  }).isRequired
};

export default Maintenance;

import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { TAB } from '../maintenance/constants.js';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import MaintenanceTagsTab from '../maintenance/maintenance-tags-tab.js';
import MaintenanceDocumentsTab from '../maintenance/maintenance-documents-tab.js';
import { CategoryIcon, ClickIcon, MediaLibraryIcon, TagIcon } from '../icons/icons.js';
import MaintenanceMediaLibraryTab from '../maintenance/maintenance-media-library-tab.js';
import MaintenanceDocumentRequestsTab from '../maintenance/maintenance-document-requests-tab.js';
import MaintenanceDocumentCategoriesTab from '../maintenance/maintenance-document-categories-tab.js';

const determineTab = query => Object.values(TAB)
  .find(val => val === query) || Object.keys(TAB)[0];

function Maintenance({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('maintenance');
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

  const tabItems = useMemo(() => [
    {
      key: TAB.documents,
      icon: <FileIcon />,
      label: t('documentsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentsTab />
        </div>
      )
    },
    {
      key: TAB.mediaLibrary,
      icon: <MediaLibraryIcon />,
      label: t('mediaLibraryTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceMediaLibraryTab />
        </div>
      )
    },
    {
      key: TAB.tags,
      icon: <TagIcon />,
      label: t('tagsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceTagsTab />
        </div>
      )
    },
    {
      key: TAB.documentRequests,
      icon: <ClickIcon />,
      label: t('documentRequestsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentRequestsTab />
        </div>
      )
    },
    {
      key: TAB.documentCategories,
      icon: <CategoryIcon />,
      label: t('documentCategoriesTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <MaintenanceDocumentCategoriesTab />
        </div>
      )
    }
  ], [t]);

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
          onChange={setCurrentTab}
          />
      </div>
    </PageTemplate>
  );
}

Maintenance.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Maintenance;

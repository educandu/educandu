import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UserRoleInfo from '../user-role-info.js';
import React, { useMemo, useState } from 'react';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { TAB } from '../content-management/constants.js';
import { CategoryIcon, MediaLibraryIcon } from '../icons/icons.js';
import ContentManagementDocumentsTab from '../content-management/content-management-documents-tab.js';
import ContentManagementMediaLibraryTab from '../content-management/content-management-media-library-tab.js';
import ContentManagementDocumentCategoriesTab from '../content-management/content-management-document-categories-tab.js';

const determineTab = query => Object.values(TAB)
  .find(val => val === query) || Object.keys(TAB)[0];

function ContentManagement({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('contentManagement');
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

  const tabItems = useMemo(() => [
    {
      key: TAB.documents,
      icon: <FileIcon />,
      label: t('documentsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ContentManagementDocumentsTab />
        </div>
      )
    },
    {
      key: TAB.mediaLibrary,
      icon: <MediaLibraryIcon />,
      label: t('mediaLibraryTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ContentManagementMediaLibraryTab />
        </div>
      )
    },
    {
      key: TAB.documentCategories,
      icon: <CategoryIcon />,
      label: t('documentCategoriesTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ContentManagementDocumentCategoriesTab />
        </div>
      )
    }
  ], [t]);

  return (
    <PageTemplate>
      <div className="ContentManagementPage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:contentManagement')}</h1>
        <div className="u-page-subtitle">
          <div>{t('pageSubtitle')}</div>
          <UserRoleInfo />
        </div>
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

ContentManagement.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default ContentManagement;

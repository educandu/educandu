import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useRequest } from '../request-context.js';
import FileIcon from '../icons/general/file-icon.js';
import { TAB } from '../content-management/constants.js';
import { CategoryIcon, MediaLibraryIcon } from '../icons/icons.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import ContentManagementDocumentsTab from '../content-management/content-management-documents-tab.js';
import ContentManagementMediaLibraryTab from '../content-management/content-management-media-library-tab.js';
import ContentManagementDocumentCategoriesTab from '../content-management/content-management-document-categories-tab.js';

const determineTab = query => Object.values(TAB)
  .find(val => val === query) || Object.keys(TAB)[0];

function ContentManagement({ PageTemplate }) {
  const user = useUser();
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
      ),
      showWhen: hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)
    },
    {
      key: TAB.mediaLibrary,
      icon: <MediaLibraryIcon />,
      label: t('mediaLibraryTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ContentManagementMediaLibraryTab />
        </div>
      ),
      showWhen: hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)
    },
    {
      key: TAB.documentCategories,
      icon: <CategoryIcon />,
      label: t('documentCategoriesTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <ContentManagementDocumentCategoriesTab />
        </div>
      ),
      showWhen: hasUserPermission(user, permissions.MANAGE_DOCUMENT_CATEGORIES)
    }
  ].filter(tabItem => tabItem.showWhen), [t, user]);

  return (
    <PageTemplate>
      <div className="ContentManagementPage">
        <h1 className="u-page-title-with-subtitle">{t('pageNames:contentManagement')}</h1>
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

ContentManagement.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default ContentManagement;

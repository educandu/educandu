import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import SettingsTab from '../admin/settings-tab.js';
import { useBeforeunload } from 'react-beforeunload';
import permissions from '../../domain/permissions.js';
import { batchShape } from '../../ui/default-prop-types.js';
import StoragePlansTab from '../admin/storage-plans-tab.js';
import { confirmDiscardUnsavedChanges } from '../confirmation-dialogs.js';
import TechnicalMaintenanceTab from '../admin/technical-maintenance-tab.js';

function Admin({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('admin');
  const [isCurrentTabDirty, setIsCurrentTabDirty] = useState(false);
  const [currentTab, setCurrentTab] = useState(request.query.tab || 'settings');

  useBeforeunload(event => {
    if (isCurrentTabDirty) {
      event.preventDefault();
    }
  });

  const changeTab = tab => {
    setCurrentTab(tab);
    setIsCurrentTabDirty(false);
    history.replaceState(null, '', routes.getAdminUrl({ tab }));
  };

  const handleTabChange = newKey => {
    if (isCurrentTabDirty) {
      confirmDiscardUnsavedChanges(t, () => changeTab(newKey));
    } else {
      changeTab(newKey);
    }
  };

  const items = [
    {
      key: 'settings',
      label: t('settingsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <SettingsTab onDirtyStateChange={setIsCurrentTabDirty} />
        </div>
      )
    },
    {
      key: 'storage-plans',
      label: t('storagePlansTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <StoragePlansTab />
        </div>
      )
    },
    {
      key: 'technical-maintenance',
      label: t('technicalMaintenanceTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <TechnicalMaintenanceTab
            lastDocumentRegenerationBatch={initialState.lastDocumentRegenerationBatch}
            lastDocumentValidationBatch={initialState.lastDocumentValidationBatch}
            lastCdnResourcesConsolidationBatch={initialState.lastCdnResourcesConsolidationBatch}
            lastCdnUploadDirectoryCreationBatch={initialState.lastCdnUploadDirectoryCreationBatch}
            />
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="AdminPage">
        <h1>{t('pageNames:admin')}</h1>
        <Restricted to={[permissions.MANAGE_SETTINGS, permissions.MANAGE_STORAGE_PLANS]}>
          <Tabs
            className="Tabs"
            type="line"
            size="middle"
            activeKey={currentTab}
            onChange={handleTabChange}
            destroyInactiveTabPane
            items={items}
            />
        </Restricted>
      </div>
    </PageTemplate>
  );
}

Admin.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    lastCdnResourcesConsolidationBatch: batchShape,
    lastDocumentRegenerationBatch: batchShape,
    lastDocumentValidationBatch: batchShape,
    lastCdnUploadDirectoryCreationBatch: batchShape
  }).isRequired
};

export default Admin;

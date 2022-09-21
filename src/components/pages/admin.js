import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { useRequest } from '../request-context.js';
import SettingsTab from '../admin/settings-tab.js';
import { useBeforeunload } from 'react-beforeunload';
import permissions from '../../domain/permissions.js';
import StoragePlansTab from '../admin/storage-plans-tab.js';
import { confirmDiscardUnsavedChanges } from '../confirmation-dialogs.js';
import TechnicalMaintenanceTab from '../admin/technical-maintenance-tab.js';
import { batchShape, settingsShape, storagePlanWithAssignedUserCountShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

function Admin({ initialState, PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('admin');
  const [isCurrentTabDirty, setIsCurrentTabDirty] = useState(false);
  const [settings, setSettings] = useState(cloneDeep(initialState.settings));
  const [currentTab, setCurrentTab] = useState(request.query.tab || 'settings');
  const [storagePlans, setStoragePlans] = useState(cloneDeep(initialState.storagePlans));

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

  return (
    <PageTemplate>
      <div className="AdminPage">
        <h1>{t('pageNames:admin')}</h1>
        <Restricted to={[permissions.MANAGE_SETTINGS, permissions.MANAGE_STORAGE_PLANS]}>
          <Tabs
            className="Tabs"
            type="line"
            size="large"
            activeKey={currentTab}
            onChange={handleTabChange}
            destroyInactiveTabPane
            >
            <TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="settings">
              <SettingsTab
                initialSettings={settings}
                onSettingsSaved={setSettings}
                onDirtyStateChange={setIsCurrentTabDirty}
                />
            </TabPane>
            <TabPane className="Tabs-tabPane" tab={t('storagePlansTabTitle')} key="storage-plans">
              <StoragePlansTab
                initialStoragePlans={storagePlans}
                onStoragePlansSaved={setStoragePlans}
                />
            </TabPane>
            <TabPane className="Tabs-tabPane" tab={t('technicalMaintenanceTabTitle')} key="technical-maintenance">
              <TechnicalMaintenanceTab
                lastDocumentRegenerationBatch={initialState.lastDocumentRegenerationBatch}
                lastDocumentValidationBatch={initialState.lastDocumentValidationBatch}
                lastCdnResourcesConsolidationBatch={initialState.lastCdnResourcesConsolidationBatch}
                lastCdnUploadDirectoryCreationBatch={initialState.lastCdnUploadDirectoryCreationBatch}
                />
            </TabPane>
          </Tabs>
        </Restricted>
      </div>
    </PageTemplate>
  );
}

Admin.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    settings: settingsShape.isRequired,
    storagePlans: PropTypes.arrayOf(storagePlanWithAssignedUserCountShape).isRequired,
    lastCdnResourcesConsolidationBatch: batchShape,
    lastDocumentRegenerationBatch: batchShape,
    lastDocumentValidationBatch: batchShape,
    lastCdnUploadDirectoryCreationBatch: batchShape
  }).isRequired
};

export default Admin;

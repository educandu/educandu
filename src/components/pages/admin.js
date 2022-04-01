import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import Restricted from '../restricted.js';
import TestsTab from '../admin/tests-tab.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import SettingsTab from '../admin/settings-tab.js';
import React, { useEffect, useState } from 'react';
import { useBeforeunload } from 'react-beforeunload';
import permissions from '../../domain/permissions.js';
import StoragePlansTab from '../admin/storage-plans-tab.js';
import { confirmDiscardUnsavedChanges } from '../confirmation-dialogs.js';
import { documentMetadataShape, settingsShape, storagePlanWithAssignedUserCountShape } from '../../ui/default-prop-types.js';

const { TabPane } = Tabs;

function Admin({ initialState, PageTemplate }) {
  const { t } = useTranslation('admin');
  const [currentTab, setCurrentTab] = useState('1');
  const [isCurrentTabDirty, setIsCurrentTabDirty] = useState(false);
  const [settings, setSettings] = useState(cloneDeep(initialState.settings));
  const [storagePlans, setStoragePlans] = useState(cloneDeep(initialState.storagePlans));

  useBeforeunload(event => {
    if (isCurrentTabDirty) {
      event.preventDefault();
    }
  });

  const handleTabChange = newKey => {
    if (isCurrentTabDirty) {
      confirmDiscardUnsavedChanges(t, () => setCurrentTab(newKey));
    } else {
      setCurrentTab(newKey);
    }
  };

  useEffect(() => {
    setIsCurrentTabDirty(false);
  }, [currentTab]);

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
            <TabPane className="Tabs-tabPane" tab={t('settingsTabTitle')} key="1">
              <SettingsTab
                initialSettings={settings}
                documents={initialState.documents}
                onSettingsSaved={setSettings}
                onDirtyStateChange={setIsCurrentTabDirty}
                />
            </TabPane>
            <TabPane className="Tabs-tabPane" tab={t('storagePlansTabTitle')} key="2">
              <StoragePlansTab
                initialStoragePlans={storagePlans}
                onStoragePlansSaved={setStoragePlans}
                />
            </TabPane>
            <TabPane className="Tabs-tabPane" tab={t('testsTabTitle')} key="100">
              <TestsTab />
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
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};

export default Admin;

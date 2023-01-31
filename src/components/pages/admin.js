import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { useBeforeunload } from 'react-beforeunload';
import permissions from '../../domain/permissions.js';
import UserAccountsTab from '../admin/user-accounts-tab.js';
import StoragePlansTab from '../admin/storage-plans-tab.js';
import AdminSettingsTab from '../admin/admin-settings-tab.js';
import { confirmDiscardUnsavedChanges } from '../confirmation-dialogs.js';
import TechnicalMaintenanceTab from '../admin/technical-maintenance-tab.js';

const TABS = {
  settings: 'settings',
  userAccounts: 'user-accounts',
  storagePlans: 'storage-plans',
  technicalMaintenance: 'technical-maintenance'
};

const determineTab = query => Object.values(TABS).find(val => val === query) || TABS.settings;

function Admin({ PageTemplate }) {
  const request = useRequest();
  const { t } = useTranslation('admin');
  const [isCurrentTabDirty, setIsCurrentTabDirty] = useState(false);
  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

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
      key: TABS.settings,
      label: t('settingsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <AdminSettingsTab onDirtyStateChange={setIsCurrentTabDirty} />
        </div>
      )
    },
    {
      key: TABS.userAccounts,
      label: t('userAccountsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <UserAccountsTab />
        </div>
      )
    },
    {
      key: TABS.storagePlans,
      label: t('storagePlansTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <StoragePlansTab />
        </div>
      )
    },
    {
      key: TABS.technicalMaintenance,
      label: t('technicalMaintenanceTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          <TechnicalMaintenanceTab />
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="AdminPage">
        <h1>{t('pageNames:admin')}</h1>
        <Restricted
          to={[
            permissions.MANAGE_SETTINGS,
            permissions.MANAGE_USERS,
            permissions.MANAGE_STORAGE_PLANS,
            permissions.MANAGE_BATCHES
          ]}
          >
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
  PageTemplate: PropTypes.func.isRequired
};

export default Admin;

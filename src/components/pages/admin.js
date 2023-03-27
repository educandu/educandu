import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { ToolOutlined } from '@ant-design/icons';
import { useRequest } from '../request-context.js';
import { useBeforeunload } from 'react-beforeunload';
import permissions from '../../domain/permissions.js';
import UsersIcon from '../icons/main-menu/users-icon.js';
import PrivateIcon from '../icons/general/private-icon.js';
import UserAccountsTab from '../admin/user-accounts-tab.js';
import StoragePlansTab from '../admin/storage-plans-tab.js';
import AdminSettingsTab from '../admin/admin-settings-tab.js';
import SettingsIcon from '../icons/main-menu/settings-icon.js';
import { confirmDiscardUnsavedChanges } from '../confirmation-dialogs.js';
import TechnicalMaintenanceTab from '../admin/technical-maintenance-tab.js';

const TABS = {
  settings: 'settings',
  userAccounts: 'user-accounts',
  storagePlans: 'storage-plans',
  technicalMaintenance: 'technical-maintenance'
};

const determineTab = query => Object.values(TABS).find(val => val === query) || Object.keys(TABS)[0];

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
      label: <div><SettingsIcon />{t('common:settings')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <AdminSettingsTab onDirtyStateChange={setIsCurrentTabDirty} />
        </div>
      )
    },
    {
      key: TABS.userAccounts,
      label: <div><UsersIcon />{t('userAccountsTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <UserAccountsTab />
        </div>
      )
    },
    {
      key: TABS.storagePlans,
      label: <div><PrivateIcon />{t('storagePlansTabTitle')}</div>,
      children: (
        <div className="Tabs-tabPane">
          <StoragePlansTab />
        </div>
      )
    },
    {
      key: TABS.technicalMaintenance,
      label: <div><ToolOutlined />{t('technicalMaintenanceTabTitle')}</div>,
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
            permissions.MANAGE_USERS,
            permissions.MANAGE_SETUP,
            permissions.BATCH_PROCESS_DATA
          ]}
          >
          <Tabs
            className="Tabs Tabs--withIcons"
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

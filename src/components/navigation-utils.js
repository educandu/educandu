import React from 'react';
import { Badge } from 'antd';
import routes from '../utils/routes.js';
import { BellOutlined } from '@ant-design/icons';
import HelpIcon from './icons/main-menu/help-icon.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import DashboardIcon from './icons/main-menu/dashboard-icon.js';
import MaintenanceIcon from './icons/main-menu/maintenance-icon.js';
import AdministrationIcon from './icons/main-menu/administration-icon.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

export const getCommonNavigationMenuItems = ({ t, user, notificationsCount, helpPage }) => {
  return [
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <div><DashboardIcon /></div>,
      badge: null,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'notifications',
      label: t('common:notifications'),
      icon: <div><BellOutlined /></div>,
      badge: <div><Badge size="small" count={notificationsCount} title="" /></div>,
      onClick: () => { window.location = routes.getDashboardUrl({ tab: 'notifications' }); },
      showWhen: !!user
    },
    {
      key: 'profile',
      label: t('pageNames:userProfile'),
      icon: <div><UsersIcon /></div>,
      badge: null,
      onClick: () => { window.location = routes.getUserProfileUrl(user._id); },
      showWhen: !!user
    },
    {
      key: 'settings',
      label: t('common:settings'),
      icon: <div><SettingsIcon /></div>,
      badge: null,
      onClick: () => { window.location = routes.getDashboardUrl({ tab: 'settings' }); },
      showWhen: !!user
    },
    {
      key: 'maintenance',
      label: t('pageNames:maintenance'),
      icon: <div><MaintenanceIcon /></div>,
      badge: null,
      onClick: () => { window.location = routes.getMaintenanceUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_PUBLIC_CONTENT)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <div><AdministrationIcon /></div>,
      badge: null,
      onClick: () => { window.location = routes.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_SETUP)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <div><HelpIcon /></div>,
      badge: null,
      onClick: () => { window.location = helpPage ? routes.getDocUrl({ id: helpPage.documentId }) : ''; },
      showWhen: !!helpPage?.documentId
    }
  ];
};

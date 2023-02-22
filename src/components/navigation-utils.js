import React from 'react';
import routes from '../utils/routes.js';
import HelpIcon from './icons/main-menu/help-icon.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import DashboardIcon from './icons/main-menu/dashboard-icon.js';
import RedactionIcon from './icons/main-menu/redaction-icon.js';
import AdministrationIcon from './icons/main-menu/administration-icon.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

export const getCommonNavigationMenuItems = ({ t, user, helpPage }) => {
  return [
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <div><DashboardIcon /></div>,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'profile',
      label: t('pageNames:userProfile'),
      icon: <div><UsersIcon /></div>,
      onClick: () => { window.location = routes.getUserProfileUrl(user._id); },
      showWhen: !!user
    },
    {
      key: 'settings',
      label: t('common:settings'),
      icon: <div><SettingsIcon /></div>,
      onClick: () => { window.location = routes.getDashboardUrl({ tab: 'settings' }); },
      showWhen: !!user
    },
    {
      key: 'redaction',
      label: t('pageNames:redaction'),
      icon: <div><RedactionIcon /></div>,
      onClick: () => { window.location = routes.getRedactionUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_CONTENT)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <div><AdministrationIcon /></div>,
      onClick: () => { window.location = routes.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.ADMIN)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <div><HelpIcon /></div>,
      onClick: () => { window.location = helpPage ? routes.getDocUrl({ id: helpPage.documentId }) : ''; },
      showWhen: !!helpPage?.documentId
    }
  ];
};

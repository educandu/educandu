import React from 'react';
import Login from './login.js';
import PropTypes from 'prop-types';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { Button, Dropdown, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { QuestionOutlined } from '@ant-design/icons';
import MenuIcon from './icons/main-menu/menu-icon.js';
import HomeIcon from './icons/main-menu/home-icon.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import { FEATURE_TOGGLES } from '../domain/constants.js';
import DefaultHeaderLogo from './default-header-logo.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
import ImportsIcon from './icons/main-menu/imports-icon.js';
import LanguageIcon from './icons/main-menu/language-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import DocumentsIcon from './icons/main-menu/documents-icon.js';
import DashboardIcon from './icons/main-menu/dashboard-icon.js';
import permissions, { hasUserPermission } from '../domain/permissions.js';

function DefaultPageHeader({ onUiLanguageClick }) {
  const user = useUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('page');
  const clientConfig = useService(ClientConfig);
  const helpPage = settings?.helpPage?.[uiLanguage];

  const pageMenuItems = [
    {
      key: 'home',
      label: t('pageNames:home'),
      icon: <HomeIcon />,
      onClick: () => { window.location = routes.getHomeUrl(); },
      showWhen: true
    },
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <DashboardIcon />,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'docs',
      label: t('pageNames:docs'),
      icon: <DocumentsIcon />,
      onClick: () => { window.location = routes.getDocsUrl(); },
      showWhen: hasUserPermission(user, permissions.VIEW_DOCS)
    },
    {
      key: 'users',
      label: t('pageNames:users'),
      icon: <UsersIcon />,
      onClick: () => { window.location = routes.getUsersUrl(); },
      showWhen: hasUserPermission(user, permissions.EDIT_USERS)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <SettingsIcon />,
      onClick: () => { window.location = routes.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.ADMIN)
    },
    {
      key: 'import',
      label: t('pageNames:imports'),
      icon: <ImportsIcon />,
      onClick: () => { window.location = routes.getImportsUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_IMPORT) && !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.import)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <QuestionOutlined />,
      onClick: () => { window.location = helpPage ? routes.getDocUrl({ key: helpPage.documentKey }) : ''; },
      showWhen: !!helpPage
    },
    {
      key: 'ui-language',
      label: t('common:language'),
      icon: <LanguageIcon />,
      onClick: () => onUiLanguageClick(),
      showWhen: true
    },
    {
      key: 'logout',
      label: t('common:logout'),
      icon: <LogoutIcon />,
      onClick: () => { window.location = routes.getLogoutUrl(); },
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

  const handleMenuItemClick = ({ key }) => {
    const clickedItem = pageMenuItems.find(item => item.key === key);
    clickedItem.onClick();
  };

  const menuItems = pageMenuItems.map(({ key, label, icon }) => ({ key, label, icon }));

  const menu = <Menu items={menuItems} onClick={handleMenuItemClick} />;

  return (
    <header className="DefaultPageHeader">
      <div className="DefaultPageHeader-header">
        <div className="DefaultPageHeader-headerContent DefaultPageHeader-headerContent--left">
          <div className="DefaultPageHeader-logo">
            <DefaultHeaderLogo size="small" />
          </div>
        </div>
        <div className="DefaultPageHeader-headerContent DefaultPageHeader-headerContent--right">
          <div className="DefaultPageHeader-loginButton">
            <Login />
          </div>
          <Dropdown overlay={menu} placement="bottomRight" trigger={['click']} arrow={{ pointAtCenter: true }}>
            <Button className="DefaultPageHeader-headerButton" icon={<MenuIcon />} type="link" />
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

DefaultPageHeader.propTypes = {
  onUiLanguageClick: PropTypes.func
};

DefaultPageHeader.defaultProps = {
  onUiLanguageClick: () => {}
};

export default DefaultPageHeader;

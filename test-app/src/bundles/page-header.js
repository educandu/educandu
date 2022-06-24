import React from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import urls from '../../../src/utils/routes.js';
import Login from '../../../src/components/login.js';
import { QuestionOutlined } from '@ant-design/icons';
import { useUser } from '../../../src/components/user-context.js';
import ClientConfig from '../../../src/bootstrap/client-config.js';
import { FEATURE_TOGGLES } from '../../../src/domain/constants.js';
import { useLocale } from '../../../src/components/locale-context.js';
import { useService } from '../../../src/components/container-context.js';
import { useSettings } from '../../../src/components/settings-context.js';
import HomeIcon from '../../../src/components/icons/main-menu/home-icon.js';
import MenuIcon from '../../../src/components/icons/main-menu/menu-icon.js';
import UsersIcon from '../../../src/components/icons/main-menu/users-icon.js';
import DefaultHeaderLogo from '../../../src/components/default-header-logo.js';
import LogoutIcon from '../../../src/components/icons/main-menu/logout-icon.js';
import ImportsIcon from '../../../src/components/icons/main-menu/imports-icon.js';
import LanguageIcon from '../../../src/components/icons/main-menu/language-icon.js';
import SettingsIcon from '../../../src/components/icons/main-menu/settings-icon.js';
import permissions, { hasUserPermission } from '../../../src/domain/permissions.js';
import DocumentsIcon from '../../../src/components/icons/main-menu/documents-icon.js';
import DashboardIcon from '../../../src/components/icons/main-menu/dashboard-icon.js';

function PageHeader({ onUiLanguageClick }) {
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
      onClick: () => { window.location = urls.getHomeUrl(); },
      showWhen: true
    },
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <DashboardIcon />,
      onClick: () => { window.location = urls.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'docs',
      label: t('pageNames:docs'),
      icon: <DocumentsIcon />,
      onClick: () => { window.location = urls.getDocsUrl(); },
      showWhen: hasUserPermission(user, permissions.VIEW_DOCS)
    },
    {
      key: 'users',
      label: t('pageNames:users'),
      icon: <UsersIcon />,
      onClick: () => { window.location = urls.getUsersUrl(); },
      showWhen: hasUserPermission(user, permissions.EDIT_USERS)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <SettingsIcon />,
      onClick: () => { window.location = urls.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.ADMIN)
    },
    {
      key: 'import',
      label: t('pageNames:imports'),
      icon: <ImportsIcon />,
      onClick: () => { window.location = urls.getImportsUrl(); },
      showWhen: hasUserPermission(user, permissions.MANAGE_IMPORT) && !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.import)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <QuestionOutlined />,
      onClick: () => { window.location = helpPage ? urls.getDocUrl({ key: helpPage.documentKey }) : ''; },
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
      onClick: () => { window.location = urls.getLogoutUrl(); },
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
    <header className="PageHeader">
      <div className="PageHeader-header">
        <div className="PageHeader-headerContent PageHeader-headerContent--left">
          <DefaultHeaderLogo />
        </div>
        <div className="PageHeader-headerContent PageHeader-headerContent--right">
          <div className="PageHeader-loginButton">
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

PageHeader.propTypes = {
  onUiLanguageClick: PropTypes.func
};

PageHeader.defaultProps = {
  onUiLanguageClick: () => {}
};

export default PageHeader;

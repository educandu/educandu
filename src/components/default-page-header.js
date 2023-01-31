import React from 'react';
import Login from './login.js';
import PropTypes from 'prop-types';
import { Button, Dropdown } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import { useSettings } from './settings-context.js';
import { QuestionOutlined } from '@ant-design/icons';
import MenuIcon from './icons/main-menu/menu-icon.js';
import DefaultHeaderLogo from './default-header-logo.js';
import LogoutIcon from './icons/main-menu/logout-icon.js';
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
  const helpPage = settings?.helpPage?.[uiLanguage];

  const pageMenuItems = [
    {
      key: 'dashboard',
      label: t('pageNames:dashboard'),
      icon: <DashboardIcon />,
      onClick: () => { window.location = routes.getDashboardUrl(); },
      showWhen: !!user
    },
    {
      key: 'redaction',
      label: t('pageNames:redaction'),
      icon: <DocumentsIcon />,
      onClick: () => { window.location = routes.getRedactionUrl(); },
      showWhen: hasUserPermission(user, permissions.VIEW_DOCS)
    },
    {
      key: 'admin',
      label: t('pageNames:admin'),
      icon: <SettingsIcon />,
      onClick: () => { window.location = routes.getAdminUrl(); },
      showWhen: hasUserPermission(user, permissions.ADMIN)
    },
    {
      key: 'help',
      label: helpPage?.linkTitle,
      icon: <QuestionOutlined />,
      onClick: () => { window.location = helpPage ? routes.getDocUrl({ id: helpPage.documentId }) : ''; },
      showWhen: !!helpPage?.documentId
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
      label: t('common:logOut'),
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
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            arrow={{ pointAtCenter: true }}
            menu={{ items: menuItems, onClick: handleMenuItemClick }}
            >
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

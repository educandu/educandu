import React from 'react';
import { Button } from 'antd';
import Login from './login.js';
import PropTypes from 'prop-types';
import urls from '../utils/urls.js';
import LinkPopover from './link-popover.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import permissions from '../domain/permissions.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import { QuestionOutlined } from '@ant-design/icons';
import MenuIcon from './icons/main-menu/menu-icon.js';
import HomeIcon from './icons/main-menu/home-icon.js';
import UsersIcon from './icons/main-menu/users-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import { FEATURE_TOGGLES } from '../domain/constants.js';
import DefaultHeaderLogo from './default-header-logo.js';
import LogoffIcon from './icons/main-menu/logoff-icon.js';
import ImportsIcon from './icons/main-menu/imports-icon.js';
import LanguageIcon from './icons/main-menu/language-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import DocumentsIcon from './icons/main-menu/documents-icon.js';
import DashboardIcon from './icons/main-menu/dashboard-icon.js';

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
      href: urls.getHomeUrl(),
      text: t('pageNames:home'),
      icon: HomeIcon,
      permission: null,
      showWhen: true
    },
    {
      key: 'dashboard',
      href: urls.getDashboardUrl(),
      text: t('pageNames:dashboard'),
      icon: DashboardIcon,
      permission: null,
      showWhen: !!user
    },
    {
      key: 'docs',
      href: urls.getDocsUrl(),
      text: t('pageNames:docs'),
      icon: DocumentsIcon,
      permission: permissions.VIEW_DOCS,
      showWhen: true
    },
    {
      key: 'users',
      href: urls.getUsersUrl(),
      text: t('pageNames:users'),
      icon: UsersIcon,
      permission: permissions.EDIT_USERS,
      showWhen: true
    },
    {
      key: 'admin',
      href: urls.getAdminUrl(),
      text: t('pageNames:admin'),
      icon: SettingsIcon,
      permission: permissions.ADMIN,
      showWhen: true
    },
    {
      key: 'import',
      href: urls.getImportsUrl(),
      text: t('pageNames:imports'),
      icon: ImportsIcon,
      permission: permissions.MANAGE_IMPORT,
      showWhen: !clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.import)
    },
    {
      key: 'help',
      href: helpPage ? urls.getDocUrl({ key: helpPage.documentKey, slug: helpPage.documentSlug }) : '',
      text: helpPage?.linkTitle,
      icon: QuestionOutlined,
      permission: null,
      showWhen: !!helpPage
    },
    {
      key: 'ui-language',
      onClick: () => onUiLanguageClick(),
      text: t('common:language'),
      icon: LanguageIcon,
      permission: null,
      showWhen: true
    },
    {
      key: 'logout',
      href: urls.getLogoutUrl(),
      text: t('common:logoff'),
      icon: LogoffIcon,
      permission: null,
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

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
          <LinkPopover items={pageMenuItems} trigger="click" placement="bottomRight">
            <Button className="DefaultPageHeader-headerButton" icon={<MenuIcon />} type="link" />
          </LinkPopover>
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

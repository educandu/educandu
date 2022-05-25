import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../../src/utils/routes.js';
import { useTranslation } from 'react-i18next';
import Login from '../../../src/components/login.js';
import { QuestionOutlined } from '@ant-design/icons';
import permissions from '../../../src/domain/permissions.js';
import { useUser } from '../../../src/components/user-context.js';
import LinkPopover from '../../../src/components/link-popover.js';
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
      href: helpPage ? urls.getDocUrl({ key: helpPage.documentKey }) : '',
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
      text: t('common:logout'),
      icon: LogoutIcon,
      permission: null,
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

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
          <LinkPopover items={pageMenuItems} trigger="click" placement="bottomRight">
            <Button className="PageHeader-headerButton" icon={<MenuIcon />} type="link" />
          </LinkPopover>
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

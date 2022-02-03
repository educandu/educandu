import Login from './login.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import urls from '../utils/urls.js';
import { Alert, Button } from 'antd';
import React, { useState } from 'react';
import LinkPopover from './link-popover.js';
import { useUser } from './user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from './locale-context.js';
import permissions from '../domain/permissions.js';
import { useService } from './container-context.js';
import { useSettings } from './settings-context.js';
import DefaultSiteLogo from './default-site-logo.js';
import UiLanguageDialog from './ui-language-dialog.js';
import ClientConfig from '../bootstrap/client-config.js';
import CookieConsentDrawer from './cookie-consent-drawer.js';
import { ALERT_TYPE, FEATURE_TOGGLES } from '../domain/constants.js';
import {
  QuestionOutlined,
  MenuOutlined,
  LogoutOutlined,
  HomeOutlined,
  IdcardOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
  ImportOutlined,
  GlobalOutlined
} from '@ant-design/icons';

function DefaultPageTemplate({ children, fullScreen, alerts }) {
  const user = useUser();
  const settings = useSettings();
  const { uiLanguage } = useLocale();
  const { t } = useTranslation('page');
  const clientConfig = useService(ClientConfig);
  const helpPage = settings?.helpPage?.[uiLanguage];
  const [isUiLanguageDialogVisible, setIsUiLanguageDialogVisible] = useState(false);

  const handleUiLanguageDialogClose = () => {
    setIsUiLanguageDialogVisible(false);
  };

  const contentAreaClasses = classNames({
    'DefaultPageTemplate-contentArea': true,
    'DefaultPageTemplate-contentArea--fullScreen': fullScreen
  });

  const contentClasses = classNames({
    'DefaultPageTemplate-content': true,
    'DefaultPageTemplate-content--fullScreen': fullScreen
  });

  const pageMenuItems = [
    {
      key: 'home',
      href: urls.getHomeUrl(),
      text: t('pageNames:home'),
      icon: HomeOutlined,
      permission: null,
      showWhen: true
    },
    {
      key: 'my-space',
      href: urls.getMySpaceUrl(),
      text: t('pageNames:mySpace'),
      icon: IdcardOutlined,
      permission: null,
      showWhen: !!user
    },
    {
      key: 'docs',
      href: urls.getDocsUrl(),
      text: t('pageNames:docs'),
      icon: FileOutlined,
      permission: permissions.VIEW_DOCS,
      showWhen: true
    },
    {
      key: 'users',
      href: urls.getUsersUrl(),
      text: t('pageNames:users'),
      icon: UserOutlined,
      permission: permissions.EDIT_USERS,
      showWhen: true
    },
    {
      key: 'settings',
      href: urls.getSettingsUrl(),
      text: t('pageNames:settings'),
      icon: SettingOutlined,
      permission: permissions.EDIT_SETTINGS,
      showWhen: true
    },
    {
      key: 'import',
      href: urls.getImportsUrl(),
      text: t('pageNames:importBatches'),
      icon: ImportOutlined,
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
      onClick: () => setIsUiLanguageDialogVisible(true),
      text: t('common:language'),
      icon: GlobalOutlined,
      permission: null,
      showWhen: true
    },
    {
      key: 'logout',
      href: urls.getLogoutUrl(),
      text: t('common:logoff'),
      icon: LogoutOutlined,
      permission: null,
      showWhen: !!user
    }
  ].filter(item => item.showWhen);

  const renderAlert = (alert, index) => {
    const shouldRenderAlert = !fullScreen || alert.showInFullScreen;

    if (!shouldRenderAlert) {
      return null;
    }

    return (
      <Alert
        key={index}
        message={alert.message}
        type={alert.type || 'info'}
        banner
        closable={alert.closable || false}
        onClose={alert.onClose || (() => { })}
        />
    );
  };

  return (
    <div className="DefaultPageTemplate">
      <header className="DefaultPageTemplate-headerArea">
        <div className="DefaultPageTemplate-header">
          <div className="DefaultPageTemplate-headerContent DefaultPageTemplate-headerContent--left">
            <div className="DefaultPageTemplate-logo">
              <DefaultSiteLogo size="small" />
            </div>
          </div>
          <div className="DefaultPageTemplate-headerContent DefaultPageTemplate-headerContent--right">
            <div className="DefaultPageTemplate-loginButton">
              <Login />
            </div>
            <LinkPopover items={pageMenuItems} trigger="click" placement="bottomRight">
              <Button className="DefaultPageTemplate-headerButton" icon={<MenuOutlined />} ghost />
            </LinkPopover>
          </div>
        </div>
        {alerts && alerts.map((alert, index) => renderAlert(alert, index))}
      </header>
      <main className={contentAreaClasses}>
        <div className={contentClasses}>
          {children}
        </div>
      </main>
      <footer className="DefaultPageTemplate-footer">
        <div className="DefaultPageTemplate-footerContent">
          {(settings?.footerLinks?.[uiLanguage] || []).map((fl, index) => (
            <span key={index.toString()} className="DefaultPageTemplate-footerLink">
              <a href={urls.getDocUrl({ key: fl.documentKey, slug: fl.documentSlug })}>{fl.linkTitle}</a>
            </span>
          ))}
        </div>
      </footer>
      <UiLanguageDialog visible={isUiLanguageDialogVisible} onClose={handleUiLanguageDialogClose} />
      <CookieConsentDrawer />
    </div>
  );
}

DefaultPageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(Object.values(ALERT_TYPE))
  })),
  children: PropTypes.node,
  fullScreen: PropTypes.bool
};

DefaultPageTemplate.defaultProps = {
  alerts: [],
  children: null,
  fullScreen: false
};

export default DefaultPageTemplate;

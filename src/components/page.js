import PropTypes from 'prop-types';
import classNames from 'classnames';
import urls from '../utils/urls.js';
import { Alert, Button } from 'antd';
import SiteLogo from './site-logo.js';
import Restricted from './restricted.js';
import LoginLogout from './login-logout.js';
import LinkPopover from './link-popover.js';
import { useTranslation } from 'react-i18next';
import permissions from '../domain/permissions.js';
import React, { useState, useEffect } from 'react';
import { useService } from './container-context.js';
import { useLanguage } from './language-context.js';
import { useSettings } from './settings-context.js';
import ClientConfig from '../bootstrap/client-config.js';
import { ALERT_TYPE, FEATURE_TOGGLES } from '../common/constants.js';
import LanguageNameProvider from '../data/language-name-provider.js';
import CountryFlagAndName from './localization/country-flag-and-name.js';
import { default as iconsNs, QuestionOutlined, MenuOutlined, HomeOutlined, FileOutlined, UserOutlined, SettingOutlined, ImportOutlined } from '@ant-design/icons';

const Icon = iconsNs.default || iconsNs;

function createLanguagesToChoose(languageNameProvider, supportedLanguages, language) {
  const data = languageNameProvider.getData(language);
  return supportedLanguages.map(lang => ({ ...data[lang], code: lang }));
}

function Page({ children, fullScreen, headerActions, alerts }) {
  const settings = useSettings();
  const clientConfig = useService(ClientConfig);
  const { t, i18n } = useTranslation('page');
  const { supportedLanguages, language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [languagesToChoose, setLanguagesToChoose] = useState(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));

  useEffect(() => {
    setLanguagesToChoose(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));
  }, [languageNameProvider, supportedLanguages, language]);

  const pageHeaderAreaClasses = classNames({
    'Page-headerArea': true,
    'Page-headerArea--fullScreen': fullScreen
  });

  const pageContentAreaClasses = classNames({
    'Page-contentArea': true,
    'Page-contentArea--fullScreen': fullScreen
  });

  const pageContentClasses = classNames({
    'Page-content': true,
    'Page-content--fullScreen': fullScreen
  });

  let headerActionComponents = null;
  if (headerActions && headerActions.length) {
    headerActionComponents = headerActions.map(action => (
      <Restricted to={action.permission} key={action.key}>
        <Button
          className="Page-headerButton"
          type={action.type || 'default'}
          loading={!!action.loading}
          disabled={!!action.disabled}
          icon={<Icon component={action.icon} />}
          onClick={action.handleClick}
          >
          {action.text}
        </Button>
      </Restricted>
    ));
  }

  const pageMenuItems = [
    {
      key: 'home',
      href: urls.getHomeUrl(),
      text: t('pageNames:home'),
      icon: HomeOutlined,
      permission: null
    },
    {
      key: 'docs',
      href: urls.getDocsUrl(),
      text: t('pageNames:docs'),
      icon: FileOutlined,
      permission: permissions.VIEW_DOCS
    },
    {
      key: 'users',
      href: urls.getUsersUrl(),
      text: t('pageNames:users'),
      icon: UserOutlined,
      permission: permissions.EDIT_USERS
    },
    {
      key: 'settings',
      href: urls.getSettingsUrl(),
      text: t('pageNames:settings'),
      icon: SettingOutlined,
      permission: permissions.EDIT_SETTINGS
    }
  ];

  if (!clientConfig.disabledFeatures.includes(FEATURE_TOGGLES.import)) {
    pageMenuItems.push({
      key: 'import',
      href: urls.getImportsUrl(),
      text: t('pageNames:importBatchCreation'),
      icon: ImportOutlined,
      permission: permissions.MANAGE_IMPORT
    });
  }

  if (settings?.helpPage?.[language]) {
    pageMenuItems.push({
      key: 'help',
      href: urls.getArticleUrl(settings.helpPage[language].documentSlug),
      text: settings.helpPage[language].linkTitle,
      icon: QuestionOutlined,
      permission: permissions.EDIT_SETTINGS
    });
  }

  pageMenuItems.push({
    key: 'language',
    node: (
      <div className="Page-languageSwitch">
        {languagesToChoose.map((lang, index) => (
          <React.Fragment key={lang.code}>
            {index !== 0 && <span>/</span>}
            <Button type="link" size="small" onClick={() => i18n.changeLanguage(lang.code)}>
              <CountryFlagAndName code={lang.flag} name={lang.name} flagOnly />
            </Button>
          </React.Fragment>
        ))}
      </div>),
    permission: null
  });

  return (
    <div className="Page">
      <header className={pageHeaderAreaClasses}>
        <div className="Page-header">
          <div className="Page-headerContent Page-headerContent--left">
            {!fullScreen && <SiteLogo />}
          </div>
          <div className="Page-headerContent Page-headerContent--center">
            {headerActionComponents}
          </div>
          <div className="Page-headerContent Page-headerContent--right">
            <div className="Page-loginLogoutButton">
              <LoginLogout />
            </div>
            <LinkPopover items={pageMenuItems} trigger="hover" placement="bottomRight">
              <Button className="Page-headerButton" icon={<MenuOutlined />} />
            </LinkPopover>
          </div>
        </div>
        {!fullScreen && alerts && alerts.map((alert, index) => (
          <Alert key={index.toString()} message={alert.message} type={alert.type || ALERT_TYPE.info} banner />
        ))}
      </header>
      <main className={pageContentAreaClasses}>
        <div className={pageContentClasses}>
          {children}
        </div>
      </main>
      <footer className="Page-footer">
        <div className="Page-footerContent">
          {(settings?.footerLinks?.[language] || []).map((fl, index) => (
            <span key={index.toString()} className="Page-footerLink">
              <a href={urls.getArticleUrl(fl.documentSlug)}>{fl.linkTitle}</a>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

Page.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(Object.values(ALERT_TYPE))
  })),
  children: PropTypes.node,
  fullScreen: PropTypes.bool,
  headerActions: PropTypes.arrayOf(PropTypes.shape({
    handleClick: PropTypes.func.isRequired,
    icon: PropTypes.elementType.isRequired,
    key: PropTypes.string.isRequired,
    permission: PropTypes.string,
    text: PropTypes.string.isRequired,
    type: PropTypes.string,
    loading: PropTypes.bool
  }))
};

Page.defaultProps = {
  alerts: [],
  children: null,
  fullScreen: false,
  headerActions: []
};

export default Page;

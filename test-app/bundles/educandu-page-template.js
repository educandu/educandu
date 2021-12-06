import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert, Button } from 'antd';
import urls from '../../src/utils/urls.js';
import EducanduLogo from './educandu-logo.js';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import permissions from '../../src/domain/permissions.js';
import Restricted from '../../src/components/restricted.js';
import LoginLogout from '../../src/components/login-logout.js';
import LinkPopover from '../../src/components/link-popover.js';
import ClientConfig from '../../src/bootstrap/client-config.js';
import { FEATURE_TOGGLES } from '../../src/common/constants.js';
import { useService } from '../../src/components/container-context.js';
import { useLanguage } from '../../src/components/language-context.js';
import { useSettings } from '../../src/components/settings-context.js';
import LanguageNameProvider from '../../src/data/language-name-provider.js';
import CountryFlagAndName from '../../src/components/localization/country-flag-and-name.js';
import { default as iconsNs, QuestionOutlined, MenuOutlined, HomeOutlined, FileOutlined, UserOutlined, SettingOutlined, ImportOutlined } from '@ant-design/icons';

const Icon = iconsNs.default || iconsNs;

function createLanguagesToChoose(languageNameProvider, supportedLanguages, language) {
  const data = languageNameProvider.getData(language);
  return supportedLanguages.map(lang => ({ ...data[lang], code: lang }));
}

function EducanduPageTemplate({ children, fullScreen, headerActions, alerts }) {
  const settings = useSettings();
  const clientConfig = useService(ClientConfig);
  const { t, i18n } = useTranslation('page');
  const { supportedLanguages, language } = useLanguage();
  const languageNameProvider = useService(LanguageNameProvider);
  const [languagesToChoose, setLanguagesToChoose] = useState(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));

  useEffect(() => {
    setLanguagesToChoose(createLanguagesToChoose(languageNameProvider, supportedLanguages, language));
  }, [languageNameProvider, supportedLanguages, language]);

  const contentAreaClasses = classNames({
    'EducanduPageTemplate-contentArea': true,
    'EducanduPageTemplate-contentArea--fullScreen': fullScreen
  });

  const contentClasses = classNames({
    'EducanduPageTemplate-content': true,
    'EducanduPageTemplate-content--fullScreen': fullScreen
  });

  let headerActionComponents = null;
  if (headerActions?.length) {
    headerActionComponents = headerActions.map(action => (
      <Restricted to={action.permission} key={action.key}>
        <Button
          className="EducanduPageTemplate-headerButton"
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
      text: t('pageNames:importBatches'),
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
      <div className="EducanduPageTemplate-languageSwitch">
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
    <div className="EducanduPageTemplate">
      <header className="EducanduPageTemplate-headerArea">
        <div className="EducanduPageTemplate-header">
          <div className="EducanduPageTemplate-headerContent EducanduPageTemplate-headerContent--left">
            <a href="/" className="EducanduPageTemplate-logoAndName">
              <EducanduLogo size="small" />&nbsp;&nbsp;educandu
            </a>
          </div>
          <div className="EducanduPageTemplate-headerContent EducanduPageTemplate-headerContent--center">
            {headerActionComponents}
          </div>
          <div className="EducanduPageTemplate-headerContent EducanduPageTemplate-headerContent--right">
            <div className="EducanduPageTemplate-loginLogoutButton">
              <LoginLogout />
            </div>
            <LinkPopover items={pageMenuItems} trigger="hover" placement="bottomRight">
              <Button className="EducanduPageTemplate-headerButton" icon={<MenuOutlined />} />
            </LinkPopover>
          </div>
        </div>
        {!fullScreen && alerts && alerts.map((alert, index) => (
          <Alert key={index.toString()} message={alert.message} type={alert.type || 'info'} banner />
        ))}
      </header>
      <main className={contentAreaClasses}>
        <div className={contentClasses}>
          {children}
        </div>
      </main>
      <footer className="EducanduPageTemplate-footer">
        <div className="EducanduPageTemplate-footerContent">
          {(settings?.footerLinks?.[language] || []).map((fl, index) => (
            <span key={index.toString()} className="EducanduPageTemplate-footerLink">
              <a href={urls.getArticleUrl(fl.documentKey, fl.documentSlug)}>{fl.linkTitle}</a>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

EducanduPageTemplate.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.node.isRequired,
    type: PropTypes.oneOf(['success', 'info', 'warning', 'error'])
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

EducanduPageTemplate.defaultProps = {
  alerts: [],
  children: null,
  fullScreen: false,
  headerActions: []
};

export default EducanduPageTemplate;

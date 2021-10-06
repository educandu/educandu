import urls from 'Utils/urls';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert, Button } from 'antd';
import ElmuLogo from 'Components/elmu-logo';
import permissions from 'Domain/permissions';
import Restricted from 'Components/restricted';
import LoginLogout from 'Components/login-logout';
import LinkPopover from 'Components/link-popover';
import { useUser } from 'Components/user-context';
import React, { useState, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useService } from 'Components/container-context';
import { useLanguage } from 'Components/language-context';
import { useSettings } from 'Components/settings-context';
import LanguageNameProvider from 'Data/language-name-provider';
import CountryFlagAndName from 'Components/localization/country-flag-and-name';
import Icon, { QuestionOutlined, MenuOutlined, HomeOutlined, FileOutlined, MenuUnfoldOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function createLanguagesToChoose(languageNameProvider, supportedLanguages, language) {
  const data = languageNameProvider.getData(language);
  return supportedLanguages.map(lang => ({ ...data[lang], code: lang }));
}

function Page({ children, disableProfileWarning, fullScreen, headerActions, customAlerts }) {
  const user = useUser();
  const settings = useSettings();
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

  let profileWarning = null;
  if (!disableProfileWarning && user && !userHasSufficientProfile(user)) {
    const message = (
      <span>
        <Trans
          t={t}
          i18nKey="profileWarning"
          components={[<a key="profile-warning" href={urls.getAccountUrl()} />]}
          />
      </span>
    );
    profileWarning = <Alert key="profile-warning" message={message} banner />;
  }

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
      key: 'menus',
      href: urls.getMenusUrl(),
      text: t('pageNames:menus'),
      icon: MenuUnfoldOutlined,
      permission: permissions.VIEW_MENUS
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

  return (
    <div className="Page">
      <header className={pageHeaderAreaClasses}>
        <div className="Page-header">
          <div className="Page-headerContent Page-headerContent--left">
            {!fullScreen && <ElmuLogo />}
          </div>
          <div className="Page-headerContent Page-headerContent--center">
            {headerActionComponents}
          </div>
          <div className="Page-headerContent Page-headerContent--right">
            <div>
              {languagesToChoose.map((lang, index) => (
                <React.Fragment key={lang.code}>
                  {index !== 0 && <span>/</span>}
                  <Button type="link" size="small" onClick={() => i18n.changeLanguage(lang.code)}>
                    <CountryFlagAndName code={lang.flag} name={lang.name} flagOnly />
                  </Button>
                </React.Fragment>
              ))}
            </div>
            {settings.helpPage[language] && (
              <Button
                className="Page-headerButton"
                icon={<QuestionOutlined />}
                title={settings.helpPage[language].linkTitle}
                href={urls.getArticleUrl(settings.helpPage[language].documentSlug)}
                />
            )}
            <LinkPopover items={pageMenuItems} trigger="hover" placement="bottom">
              <Button className="Page-headerButton" icon={<MenuOutlined />} />
            </LinkPopover>
            <div className="Page-loginLogoutButton">
              <LoginLogout />
            </div>
          </div>
        </div>
        {!fullScreen && profileWarning}
        {!fullScreen && customAlerts && customAlerts.map((alert, index) => (
          <Alert key={index.toString()} message={alert.message} type={alert.type || 'info'} banner />
        ))}
      </header>
      <main className={pageContentAreaClasses}>
        <div className={pageContentClasses}>
          {children}
        </div>
      </main>
      <footer className="Page-footer">
        <div className="Page-footerContent">
          {(settings.footerLinks?.[language] || []).map((fl, index) => (
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
  children: PropTypes.node,
  customAlerts: PropTypes.arrayOf(PropTypes.shape({
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'info', 'warning', 'error'])
  })),
  disableProfileWarning: PropTypes.bool,
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
  children: null,
  customAlerts: null,
  disableProfileWarning: false,
  fullScreen: false,
  headerActions: null
};

export default Page;

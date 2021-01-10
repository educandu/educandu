import React from 'react';
import urls from '../utils/urls';
import ElmuLogo from './elmu-logo';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Alert, Button } from 'antd';
import Restricted from './restricted';
import LoginLogout from './login-logout';
import LinkPopover from './link-popover';
import permissions from '../domain/permissions';
import { useUser } from '../components/user-context';
import { Trans, useTranslation } from 'react-i18next';
import Icon, { QuestionOutlined, MenuOutlined, HomeOutlined, FileOutlined, MenuUnfoldOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function Page({ children, disableProfileWarning, fullScreen, headerActions, customAlerts }) {
  const user = useUser();
  const { t, i18n } = useTranslation('page');

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
          components={[<a key="profile-warning" href={urls.getProfileUrl()} />]}
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
              <Button type="link" onClick={() => i18n.changeLanguage('de')}>
                <span className="flag-icon flag-icon-de" />
              </Button>
              /
              <Button type="link" onClick={() => i18n.changeLanguage('en')}>
                <span className="flag-icon flag-icon-us" />
              </Button>
            </div>
            <Button className="Page-headerButton" icon={<QuestionOutlined />} href={urls.getArticleUrl('hilfe')} />
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
          <span className="Page-footerLine">
            <span className="Page-footerLink"><a href={urls.getArticleUrl('ueber-elmu')}>Über ELMU</a></span>
            <span className="Page-footerLink"><a href={urls.getArticleUrl('organisation')}>Organisation</a></span>
          </span>
          <span className="Page-footerLine">
            <span className="Page-footerLink"><a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsvertrag</a></span>
            <span className="Page-footerLink"><a href={urls.getArticleUrl('datenschutz')}>Datenschutz</a></span>
          </span>
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
    type: PropTypes.string
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

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
import Icon, { QuestionOutlined, MenuOutlined, HomeOutlined, FileOutlined, MenuUnfoldOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons';

const pageMenuItems = [
  {
    key: 'home',
    href: urls.getHomeUrl(),
    text: 'Home',
    icon: HomeOutlined,
    permission: null
  },
  {
    key: 'docs',
    href: urls.getDocsUrl(),
    text: 'Dokumente',
    icon: FileOutlined,
    permission: permissions.VIEW_DOCS
  },
  {
    key: 'menus',
    href: urls.getMenusUrl(),
    text: 'Menüs',
    icon: MenuUnfoldOutlined,
    permission: permissions.VIEW_MENUS
  },
  {
    key: 'users',
    href: urls.getUsersUrl(),
    text: 'Benutzer',
    icon: UserOutlined,
    permission: permissions.EDIT_USERS
  },
  {
    key: 'settings',
    href: urls.getSettingsUrl(),
    text: 'Einstellungen',
    icon: SettingOutlined,
    permission: permissions.EDIT_SETTINGS
  }
];

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function Page({ children, disableProfileWarning, fullScreen, headerActions }) {
  const user = useUser();

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
        Ihr Benutzerprofil ist noch nicht vollständig.
        Klicken Sie <a href={urls.getProfileUrl()}>hier</a>,
        um Ihr Profil zu bearbeiten.
      </span>
    );
    profileWarning = <Alert message={message} banner />;
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
  disableProfileWarning: false,
  fullScreen: false,
  headerActions: null
};

export default Page;

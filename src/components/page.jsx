const React = require('react');
const urls = require('../utils/urls');
const Alert = require('antd/lib/alert');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const ElmuLogo = require('./elmu-logo.jsx');
const PageMenu = require('./page-menu.jsx');
const LoginLogout = require('./login-logout.jsx');
const { useUser } = require('../components/user-context.jsx');

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function Page({ children, disableProfileWarning, fullScreen, headerContent }) {
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

  return (
    <div className="Page">
      <header className={pageHeaderAreaClasses}>
        <div className="Page-header">
          <div className="Page-headerContent Page-headerContent--left">
            {!fullScreen && <ElmuLogo />}
            <PageMenu />
          </div>
          <div className="Page-headerContent Page-headerContent--center">
            {headerContent}
          </div>
          <div className="Page-headerContent Page-headerContent--right">
            <LoginLogout />
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
          <a href={urls.getArticleUrl('ueber-elmu')}>Über ELMU</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('organisation')}>Organisation</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsvertrag</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('datenschutz')}>Datenschutz</a>
        </div>
      </footer>
    </div>
  );
}

Page.propTypes = {
  children: PropTypes.node,
  disableProfileWarning: PropTypes.bool,
  fullScreen: PropTypes.bool,
  headerContent: PropTypes.node
};

Page.defaultProps = {
  children: null,
  disableProfileWarning: false,
  fullScreen: false,
  headerContent: null
};

module.exports = Page;

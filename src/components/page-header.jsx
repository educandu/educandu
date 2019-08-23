const React = require('react');
const urls = require('../utils/urls');
const Alert = require('antd/lib/alert');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const LoginLogout = require('./login-logout.jsx');
const { userProps } = require('../ui/default-prop-types');
const { withUser } = require('../components/user-context.jsx');

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function PageHeader({ children, fullScreen, disableProfileWarning, user }) {
  let profileWarning;

  if (disableProfileWarning || !user || userHasSufficientProfile(user)) {
    profileWarning = null;
  } else {
    const message = (
      <span>
        Ihr Benutzerprofil ist noch nicht vollständig.
        Klicken Sie <a href={urls.getProfileUrl()}>hier</a>,
        um Ihr Profil zu bearbeiten.
      </span>
    );
    profileWarning = <Alert message={message} banner />;
  }

  const classes = classNames({
    'PageHeader': true,
    'PageHeader--fullScreen': fullScreen
  });

  return (
    <React.Fragment>
      <header className={classes}>
        <div className="PageHeader-logo">
          {!fullScreen && <a href={urls.getHomeUrl()}>elmu</a>}
        </div>
        <div className="PageHeader-links">
          {children}
        </div>
        <div className="PageHeader-user">
          <LoginLogout />
        </div>
      </header>
      {!fullScreen && profileWarning}
    </React.Fragment>
  );
}

PageHeader.propTypes = {
  ...userProps,
  children: PropTypes.node,
  disableProfileWarning: PropTypes.bool,
  fullScreen: PropTypes.bool
};

PageHeader.defaultProps = {
  children: null,
  disableProfileWarning: false,
  fullScreen: false
};

module.exports = withUser(PageHeader);

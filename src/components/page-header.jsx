const React = require('react');
const urls = require('../utils/urls');
const Alert = require('antd/lib/alert');
const PropTypes = require('prop-types');
const LoginLogout = require('./login-logout.jsx');
const { userProps } = require('../ui/default-prop-types');
const { withUser } = require('../components/user-context.jsx');

const userHasSufficientProfile = user => user.profile && (user.profile.firstName || user.profile.lastName);

function PageHeader({ children, disableProfileWarning, user }) {
  let profileWarning;

  if (disableProfileWarning || userHasSufficientProfile(user)) {
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

  return (
    <React.Fragment>
      <header className="PageHeader">
        <a className="PageHeader-logo" href={urls.getHomeUrl()}>elmu</a>
        <div className="PageHeader-links">
          {children}
        </div>
        <div className="PageHeader-user">
          <LoginLogout />
        </div>
      </header>
      {profileWarning}
    </React.Fragment>
  );
}

PageHeader.propTypes = {
  ...userProps,
  children: PropTypes.node,
  disableProfileWarning: PropTypes.bool
};

PageHeader.defaultProps = {
  children: null,
  disableProfileWarning: false
};

module.exports = withUser(PageHeader);

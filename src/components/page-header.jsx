const React = require('react');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const { withUser } = require('./user-context.jsx');
const { userProps } = require('../ui/default-prop-types');

function createAuthenticatedUserHeader(user) {
  return (
    <div>
      <span>Willkommen, <b>{user.username}</b></span>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getLogoutUrl()}>Abmelden</a>
    </div>
  );
}

function createAnonymousUserHeader() {
  return (
    <div>
      <a href={urls.getLoginUrl()}>Anmelden</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getRegisterUrl()}>Registrieren</a>
    </div>
  );
}

function PageHeader({ user, children }) {
  return (
    <header className="PageHeader">
      <a className="PageHeader-logo" href={urls.getHomeUrl()}>elmu</a>
      <div className="PageHeader-links">
        {children}
      </div>
      <div className="PageHeader-user">
        {user ? createAuthenticatedUserHeader(user) : createAnonymousUserHeader()}
      </div>
    </header>
  );
}

PageHeader.propTypes = {
  ...userProps,
  children: PropTypes.node
};

PageHeader.defaultProps = {
  children: null
};

module.exports = withUser(PageHeader);

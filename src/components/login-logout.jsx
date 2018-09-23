const React = require('react');
const urls = require('../utils/urls');
const { withUser } = require('./user-context.jsx');
const { withRequest } = require('./request-context.jsx');
const { requestProps, userProps } = require('../ui/default-prop-types');

function createAuthenticatedUserHeader(username) {
  return (
    <div>
      <span>Willkommen, <b>{username}</b></span>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getLogoutUrl()}>Abmelden</a>
    </div>
  );
}

function createAnonymousUserHeader(redirectUrl) {
  return (
    <div>
      <a href={urls.getLoginUrl(redirectUrl)}>Anmelden</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getRegisterUrl()}>Registrieren</a>
    </div>
  );
}

function LoginLogout({ request, user }) {
  return (
    <span className="LoginLogout">
      {user ? createAuthenticatedUserHeader(user.username) : createAnonymousUserHeader(request.originalUrl)}
    </span>
  );
}

LoginLogout.propTypes = {
  ...requestProps,
  ...userProps
};


module.exports = withRequest(withUser(LoginLogout));

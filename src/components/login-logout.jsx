const React = require('react');
const gravatar = require('gravatar');
const urls = require('../utils/urls');
const Avatar = require('antd/lib/avatar');
const Popover = require('antd/lib/popover');
const { withUser } = require('./user-context.jsx');
const { withRequest } = require('./request-context.jsx');
const { requestProps, userProps } = require('../ui/default-prop-types');

function createAuthenticatedUserHeader(user) {
  const gravatarUrl = gravatar.url(user.email, { d: 'mp' });
  const popoverContent = (
    <div>
      <div><a href={urls.getProfileUrl()}>Profil bearbeiten</a></div>
      <div><a href={urls.getLogoutUrl()}>Abmelden</a></div>
    </div>
  );
  return (
    <div>
      <Popover title={user.username} content={popoverContent} placement="bottomRight" trigger="hover">
        <Avatar src={gravatarUrl} alt={user.username} />
      </Popover>
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
      {user ? createAuthenticatedUserHeader(user) : createAnonymousUserHeader(request.originalUrl)}
    </span>
  );
}

LoginLogout.propTypes = {
  ...requestProps,
  ...userProps
};


module.exports = withRequest(withUser(LoginLogout));

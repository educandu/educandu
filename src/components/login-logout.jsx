const React = require('react');
const gravatar = require('gravatar');
const urls = require('../utils/urls');
const Avatar = require('antd/lib/avatar');
const { useUser } = require('./user-context.jsx');
const LinkPopover = require('./link-popover.jsx');
const { useRequest } = require('./request-context.jsx');

const gravatarPopoverItems = [
  {
    key: 'profile',
    href: urls.getProfileUrl(),
    text: 'Profil bearbeiten',
    icon: 'profile',
    permission: null
  }, {
    key: 'logout',
    href: urls.getLogoutUrl(),
    text: 'Abmelden',
    icon: 'logout',
    permission: null
  }
];

function createAuthenticatedUserHeader(user) {
  const gravatarUrl = gravatar.url(user.email, { d: 'mp' });

  const popoverTitle = (
    <span>Sie sind angemeldet als <b>{user.username}</b></span>
  );

  return (
    <div>
      <LinkPopover
        title={popoverTitle}
        items={gravatarPopoverItems}
        placement="bottomRight"
        trigger="hover"
        >
        <Avatar src={gravatarUrl} alt={user.username} shape="square" />
      </LinkPopover>
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

function LoginLogout() {
  const user = useUser();
  const request = useRequest();

  return (
    <span className="LoginLogout">
      {user ? createAuthenticatedUserHeader(user) : createAnonymousUserHeader(request.originalUrl)}
    </span>
  );
}

module.exports = LoginLogout;

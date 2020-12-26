import React from 'react';
import { Avatar } from 'antd';
import gravatar from 'gravatar';
import urls from '../utils/urls';
import { useUser } from './user-context';
import LinkPopover from './link-popover';
import { useRequest } from './request-context';
import { ProfileOutlined, LogoutOutlined } from '@ant-design/icons';

const gravatarPopoverItems = [
  {
    key: 'profile',
    href: urls.getProfileUrl(),
    text: 'Profil bearbeiten',
    icon: ProfileOutlined,
    permission: null
  }, {
    key: 'logout',
    href: urls.getLogoutUrl(),
    text: 'Abmelden',
    icon: LogoutOutlined,
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

export default LoginLogout;

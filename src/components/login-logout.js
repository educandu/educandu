import React from 'react';
import { Avatar } from 'antd';
import gravatar from 'gravatar';
import urls from '../utils/urls';
import { useUser } from './user-context';
import LinkPopover from './link-popover';
import { useRequest } from './request-context';
import { Trans, useTranslation } from 'react-i18next';
import { ProfileOutlined, LogoutOutlined } from '@ant-design/icons';

function createAuthenticatedUserHeader(user, t) {
  const gravatarUrl = gravatar.url(user.email, { d: 'mp' });

  const popoverTitle = (
    <span>
      <Trans
        t={t}
        i18nKey="logonState"
        components={[<b key="username" />]}
        values={{ username: user.username }}
        />
    </span>
  );

  const gravatarPopoverItems = [
    {
      key: 'profile',
      href: urls.getAccountUrl(),
      text: t('account'),
      icon: ProfileOutlined,
      permission: null
    }, {
      key: 'logout',
      href: urls.getLogoutUrl(),
      text: t('logoff'),
      icon: LogoutOutlined,
      permission: null
    }
  ];

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

function createAnonymousUserHeader(redirectUrl, t) {
  return (
    <div>
      <a href={urls.getLoginUrl(redirectUrl)}>{t('logon')}</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getRegisterUrl()}>{t('register')}</a>
    </div>
  );
}

function LoginLogout() {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('loginLogout');

  return (
    <span className="LoginLogout">
      {user ? createAuthenticatedUserHeader(user, t) : createAnonymousUserHeader(request.originalUrl, t)}
    </span>
  );
}

export default LoginLogout;

import React from 'react';
import gravatar from 'gravatar';
import urls from '../utils/urls.js';
import { Avatar, Tooltip } from 'antd';
import { useUser } from './user-context.js';
import { useRequest } from './request-context.js';
import { Trans, useTranslation } from 'react-i18next';

function Login() {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('login');

  const handleAvatarClick = () => {
    window.location = urls.getMySpaceUrl();
  };

  const createAuthenticatedUserHeader = () => {
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

    return (
      <Tooltip title={popoverTitle} placement="bottomRight">
        <Avatar src={gravatarUrl} alt={user.username} shape="square" onClick={handleAvatarClick} />
      </Tooltip>
    );
  };

  const createAnonymousUserHeader = redirectUrl => (
    <div>
      <a href={urls.getLoginUrl(redirectUrl)}>{t('logon')}</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getRegisterUrl()}>{t('register')}</a>
    </div>
  );

  return (
    <span>
      {user ? createAuthenticatedUserHeader(user, t) : createAnonymousUserHeader(request.originalUrl, t)}
    </span>
  );
}

export default Login;

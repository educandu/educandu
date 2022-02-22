import React from 'react';
import gravatar from 'gravatar';
import urls from '../utils/urls.js';
import { Avatar, Tooltip } from 'antd';
import { useUser } from './user-context.js';
import { Trans, useTranslation } from 'react-i18next';
import { getCurrentUrl } from '../ui/browser-helper.js';

function Login() {
  const user = useUser();
  const { t } = useTranslation('login');

  const handleAvatarClick = () => {
    window.location = urls.getMySpaceUrl();
  };

  const handleLoginClick = () => {
    window.location = urls.getLoginUrl(getCurrentUrl());
  };

  const handleRegisterClick = () => {
    window.location = urls.getRegisterUrl();
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

  const createAnonymousUserHeader = () => (
    <div>
      <a onClick={handleLoginClick}>{t('logon')}</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a onClick={handleRegisterClick}>{t('register')}</a>
    </div>
  );

  return (
    <span>
      {user ? createAuthenticatedUserHeader() : createAnonymousUserHeader()}
    </span>
  );
}

export default Login;

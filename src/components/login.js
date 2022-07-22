import React from 'react';
import gravatar from 'gravatar';
import { Avatar, Tooltip } from 'antd';
import routes from '../utils/routes.js';
import { useUser } from './user-context.js';
import { Trans, useTranslation } from 'react-i18next';
import { getCurrentUrl } from '../ui/browser-helper.js';

function Login() {
  const user = useUser();
  const { t } = useTranslation('login');

  const handleAvatarClick = () => {
    window.location = routes.getDashboardUrl();
  };

  const handleLoginClick = () => {
    window.location = routes.getLoginUrl(getCurrentUrl());
  };

  const handleRegisterClick = () => {
    window.location = routes.getRegisterUrl();
  };

  const createAuthenticatedUserHeader = () => {
    const gravatarUrl = gravatar.url(user.email, { d: 'mp' });

    const popoverTitle = (
      <span>
        <Trans
          t={t}
          i18nKey="loginState"
          components={[<b key="username" />]}
          values={{ username: user.username }}
          />
      </span>
    );

    return (
      <Tooltip title={popoverTitle} placement="bottomRight">
        <Avatar className="Avatar" src={gravatarUrl} alt={user.username} shape="circle" size="large" onClick={handleAvatarClick} />
      </Tooltip>
    );
  };

  const createAnonymousUserHeader = () => (
    <div>
      <a onClick={handleLoginClick}>{t('login')}</a>
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

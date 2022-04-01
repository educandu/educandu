import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import LoginForm from '../login-form.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import { Button } from 'antd';

function Login({ PageTemplate, SiteLogo }) {
  const formRef = useRef();
  const request = useRequest();
  const { t } = useTranslation('login');

  const redirectAfterLogin = () => {
    window.location = request.query.redirect || urls.getDefaultLoginRedirectUrl();
  };

  const handleLogonClick = () => {
    formRef.current.submit();
  };

  return (
    <PageTemplate fullScreen>
      <div className="LoginPage">
        <div className="LoginPage-title">
          <SiteLogo readonly />
        </div>
        <div className="LoginPage-form">
          <LoginForm
            formRef={formRef}
            name="login-page-login-form"
            onLoginSucceeded={redirectAfterLogin}
            />
          <div className="LoginPage-forgotPasswordLink">
            <a href={urls.getResetPasswordUrl()}>{t('forgotPassword')}</a>
          </div>
          <div className="LoginPage-logonButton">
            <Button type="primary" size="large" onClick={handleLogonClick} block>
              {t('common:logon')}
            </Button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

Login.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Login;

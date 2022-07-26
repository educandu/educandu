import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import WarningIcon from '../icons/general/warning-icon.js';

function Login({ PageTemplate, SiteLogo }) {
  const formRef = useRef();
  const request = useRequest();
  const { t } = useTranslation('login');

  const redirectAfterLogin = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  const handleLoginClick = () => {
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
            <a href={routes.getResetPasswordUrl()}>{t('forgotPassword')}</a>
          </div>
          <div className="LoginPage-loginButton">
            <Button type="primary" size="large" onClick={handleLoginClick} block>
              {t('common:login')}
            </Button>
          </div>
          <div className="LoginPage-hint">
            <div className="LoginPage-hintIcon"><WarningIcon /></div>
            {t('hintContent')}
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

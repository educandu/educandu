import { Button } from 'antd';
import PropTypes from 'prop-types';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useRef, useState } from 'react';
import { useRequest } from '../request-context.js';

function Login({ PageTemplate, SiteLogo }) {
  const formRef = useRef();
  const request = useRequest();
  const { t } = useTranslation('login');
  const [isFrozen, setIsFrozen] = useState(false);

  const handleLoginButtonClick = () => {
    formRef.current.submit();
  };

  const handleLoginSucceeded = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  const handleLoginFailedIrrecoverably = () => {
    setIsFrozen(true);
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
            onLoginSucceeded={handleLoginSucceeded}
            onLoginFailedIrrecoverably={handleLoginFailedIrrecoverably}
            />
          {!isFrozen && (
            <Fragment>
              <div className="LoginPage-forgotPasswordLink">
                <a href={routes.getResetPasswordUrl()}>{t('forgotPassword')}</a>
              </div>
              <div className="LoginPage-loginButton">
                <Button type="primary" size="large" onClick={handleLoginButtonClick} block>
                  {t('common:login')}
                </Button>
              </div>
            </Fragment>
          )}
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

import React from 'react';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import LoginForm from '../login-form.js';
import { useRequest } from '../request-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';

function Login({ PageTemplate, SiteLogo }) {
  const request = useRequest();
  const alerts = useGlobalAlerts();

  const redirectAfterLogin = () => {
    window.location = request.query.redirect || urls.getDefaultLoginRedirectUrl();
  };

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="LoginPage">
        <div className="LoginPage-title">
          <SiteLogo readonly />
        </div>
        <div className="LoginPage-form">
          <LoginForm
            layout="horizontal"
            name="login-page-login-form"
            onLoginSucceeded={redirectAfterLogin}
            />
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

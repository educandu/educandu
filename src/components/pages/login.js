import React from 'react';
import PropTypes from 'prop-types';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import { useRequest } from '../request-context.js';

function Login({ PageTemplate, SiteLogo }) {
  const request = useRequest();

  const handleLoginSucceeded = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  return (
    <PageTemplate fullScreen>
      <div className="LoginPage">
        <div className="LoginPage-title">
          <SiteLogo readonly />
        </div>
        <div className="LoginPage-form">
          <LoginForm
            name="login-page-login-form"
            redirect={request.query.redirect}
            onLoginSucceeded={handleLoginSucceeded}
            showPasswordReset
            showLoginButtons
            allowExternalLogin
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

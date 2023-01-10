import { Button } from 'antd';
import PropTypes from 'prop-types';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import ExternalAccountProviderDialog from '../external-account-provider-dialog.js';

function Login({ PageTemplate, SiteLogo }) {
  const formRef = useRef();
  const request = useRequest();
  const { t } = useTranslation('login');
  const clientConfig = useService(ClientConfig);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isExternalAccountProviderDialogOpen, setIsExternalAccountProviderDialogOpen] = useState(false);

  const loginUsingExternalProvider = providerKey => {
    const provider = clientConfig.samlAuth.identityProviders.find(p => p.key === providerKey);
    window.location = routes.getSamlAuthLoginPath(provider.key);
  };

  const handleLoginButtonClick = () => {
    formRef.current.submit();
  };

  const handleLoginWithShibbolethButtonClick = () => {
    if (clientConfig.samlAuth.identityProviders.length === 1) {
      loginUsingExternalProvider(clientConfig.samlAuth.identityProviders[0].key);
    } else {
      setIsExternalAccountProviderDialogOpen(true);
    }
  };

  const handleLoginSucceeded = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  const handleLoginBlocked = () => {
    setIsBlocked(true);
  };

  const handleExternalAccountProviderDialogOk = providerKey => {
    setIsExternalAccountProviderDialogOpen(false);
    loginUsingExternalProvider(providerKey);
  };

  const handleExternalAccountProviderDialogCancel = () => {
    setIsExternalAccountProviderDialogOpen(false);
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
            onLoginBlocked={handleLoginBlocked}
            showPasswordReset
            />
          {!isBlocked && (
            <div className="LoginPage-loginButton">
              <Button type="primary" size="large" onClick={handleLoginButtonClick} block>
                {t('common:login')}
              </Button>
            </div>
          )}
          {!!clientConfig.samlAuth?.identityProviders.length && (
            <div className="LoginPage-loginButton LoginPage-loginButton--secondary">
              <Button size="large" onClick={handleLoginWithShibbolethButtonClick} block>
                {t('loginWithShibboleth')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <ExternalAccountProviderDialog
        isOpen={isExternalAccountProviderDialogOpen}
        onOk={handleExternalAccountProviderDialogOk}
        onCancel={handleExternalAccountProviderDialogCancel}
        />
    </PageTemplate>
  );
}

Login.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default Login;

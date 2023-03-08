import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import CustomAlert from '../custom-alert.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import RegistrationForm from '../registration-form.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { makeCompoundWord } from '../../utils/string-utils.js';
import UserApiClient from '../../api-clients/user-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';

const VIEW = {
  choices: 'choices',
  login: 'login',
  register: 'register'
};

function ConnectExternalAccount({ PageTemplate, SiteLogo }) {
  const request = useRequest();
  const { uiLanguage } = useLocale();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('connectExternalAccount');
  const [currentView, setCurrentView] = useState(VIEW.choices);
  const userApiClient = useSessionAwareApiClient(UserApiClient);

  const handleLoginChoiceClick = () => {
    setCurrentView(VIEW.login);
  };

  const handleRegisterChoiceClick = () => {
    setCurrentView(VIEW.register);
  };

  const handleAbortChoiceClick = async () => {
    await userApiClient.abortExternalAccountConnection();
    window.location = routes.getDefaultLogoutRedirectUrl();
  };

  const handleLoginSucceeded = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  const handleBackButtonClick = () => {
    setCurrentView(VIEW.choices);
  };

  const appNameCompound = makeCompoundWord(clientConfig.appName, uiLanguage);

  return (
    <PageTemplate fullScreen>
      <div className="ConnectExternalAccountPage">
        <div className="ConnectExternalAccountPage-title">
          <SiteLogo readonly />
        </div>
        {currentView === VIEW.choices && (
          <div className="ConnectExternalAccountPage-choicesView">
            <div className="ConnectExternalAccountPage-viewTitle">
              <h2>{t('welcomeBack')}</h2>
            </div>
            <div className="ConnectExternalAccountPage-description">
              {t('choicesDescription', { appName: appNameCompound })}
            </div>
            <div className="ConnectExternalAccountPage-choices">
              <Button type="primary" size="large" block onClick={handleLoginChoiceClick}>{t('choicesLogin')}</Button>
              <Button type="primary" size="large" block onClick={handleRegisterChoiceClick}>{t('choicesRegister')}</Button>
              <Button size="large" block onClick={handleAbortChoiceClick}>{t('choicesAbort')}</Button>
            </div>
            <div className="ConnectExternalAccountPage-infoBox">
              <CustomAlert
                banner
                message={t('infoBoxTitle')}
                description={t('infoBoxDescription', { appName: appNameCompound })}
                />
            </div>
          </div>
        )}
        {currentView === VIEW.login && (
          <div className="ConnectExternalAccountPage-loginView">
            <LoginForm
              name="connect-external-account-page-login-form"
              onLoginSucceeded={handleLoginSucceeded}
              connectExternalAccount
              showInPanel
              showPasswordReset
              showLoginButtons
              />
            <div className="ConnectExternalAccountPage-backButton">
              <Button size="large" onClick={handleBackButtonClick} block>
                {t('common:back')}
              </Button>
            </div>
          </div>
        )}
        {currentView === VIEW.register && (
          <div className="ConnectExternalAccountPage-registerView">
            <RegistrationForm />
            <div className="ConnectExternalAccountPage-backButton">
              <Button size="large" onClick={handleBackButtonClick} block>
                {t('common:back')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

ConnectExternalAccount.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default ConnectExternalAccount;

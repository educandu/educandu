import { Button } from 'antd';
import Alert from '../alert.js';
import PropTypes from 'prop-types';
import LoginForm from '../login-form.js';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { useLocale } from '../locale-context.js';
import { useRequest } from '../request-context.js';
import { useService } from '../container-context.js';
import RegistrationForm from '../registration-form.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { makeCompoundWord } from '../../utils/string-utils.js';

const VIEW = {
  choices: 'choices',
  login: 'login',
  register: 'register'
};

function LinkExternalAccount({ PageTemplate, SiteLogo }) {
  const request = useRequest();
  const loginFormRef = useRef();
  const { uiLanguage } = useLocale();
  const registrationFormRef = useRef();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('linkExternalAccount');
  const [isLoginBlocked, setIsLoginBlocked] = useState(false);
  const [currentView, setCurrentView] = useState(VIEW.choices);

  const handleLoginChoiceClick = () => {
    setCurrentView(VIEW.login);
  };

  const handleRegisterChoiceClick = () => {
    setCurrentView(VIEW.register);
  };

  const handleAbortChoiceClick = () => {
    throw new Error('NOT IMPLEMENTED');
  };

  const handleLoginButtonClick = () => {
    loginFormRef.current.submit();
  };

  const handleLoginSucceeded = () => {
    window.location = request.query.redirect || routes.getDefaultLoginRedirectUrl();
  };

  const handleLoginBlocked = () => {
    setIsLoginBlocked(true);
  };

  const handleRegistrationStarted = () => {};

  const handleRegistrationFailed = () => {};

  const handleRegistrationSucceeded = () => {};

  const handleBackButtonClick = () => {
    setCurrentView(VIEW.choices);
  };

  const appNameCompound = makeCompoundWord(clientConfig.appName, uiLanguage);

  return (
    <PageTemplate fullScreen>
      <div className="LinkExternalAccountPage">
        <div className="LinkExternalAccountPage-title">
          <SiteLogo readonly />
        </div>
        {currentView === VIEW.choices && (
          <div className="LinkExternalAccountPage-choicesView">
            <div className="LinkExternalAccountPage-viewTitle">
              <h2>{t('welcomeBack')}</h2>
            </div>
            <div className="LinkExternalAccountPage-description">
              {t('choicesDescription', { appName: appNameCompound })}
            </div>
            <div className="LinkExternalAccountPage-choices">
              <Button type="primary" size="large" block onClick={handleLoginChoiceClick}>{t('choicesLogin')}</Button>
              <Button type="primary" size="large" block onClick={handleRegisterChoiceClick}>{t('choicesRegister')}</Button>
              <Button size="large" block onClick={handleAbortChoiceClick}>{t('choicesAbort')}</Button>
            </div>
            <div className="LinkExternalAccountPage-infoBox">
              <Alert message={t('infoBoxTitle')} description={t('infoBoxDescription', { appName: appNameCompound })} />
            </div>
          </div>
        )}
        {currentView === VIEW.login && (
          <div className="LinkExternalAccountPage-loginView">
            <LoginForm
              formRef={loginFormRef}
              name="link-external-account-page-login-form"
              onLoginSucceeded={handleLoginSucceeded}
              onLoginBlocked={handleLoginBlocked}
              linkExternalAccount
              showPasswordReset
              />
            {!isLoginBlocked && (
              <div className="LinkExternalAccountPage-loginButton">
                <Button type="primary" size="large" onClick={handleLoginButtonClick} block>
                  {t('common:login')}
                </Button>
              </div>
            )}
            <div className="LinkExternalAccountPage-backButton">
              <Button size="large" onClick={handleBackButtonClick} block>
                {t('common:back')}
              </Button>
            </div>
          </div>
        )}
        {currentView === VIEW.register && (
          <div className="LinkExternalAccountPage-registerView">
            <RegistrationForm
              formRef={registrationFormRef}
              name="link-external-account-page-registration-form"
              onRegistrationFailed={handleRegistrationFailed}
              onRegistrationStarted={handleRegistrationStarted}
              onRegistrationSucceeded={handleRegistrationSucceeded}
              />
            <div className="LinkExternalAccountPage-backButton">
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

LinkExternalAccount.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  SiteLogo: PropTypes.func.isRequired
};

export default LinkExternalAccount;

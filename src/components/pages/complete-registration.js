import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import SiteLogo from '../site-logo.js';
import Countdown from '../countdown.js';
import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { userShape } from '../../ui/default-prop-types.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';

function CompleteRegistration({ initialState, PageTemplate }) {
  const { t } = useTranslation('completeRegistration');
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  useEffect(() => setIsCountdownRunning(true), []);
  const alerts = useGlobalAlerts();

  const registrationSuccessContent = () => (
    <React.Fragment>
      <p>{t('registrationSuccess')}</p>
      <Countdown
        seconds={10}
        isRunning={isCountdownRunning}
        onComplete={() => {
          window.location = urls.getLoginUrl();
        }}
        >
        {seconds => (
          <Trans
            t={t}
            i18nKey="redirectMessage"
            values={{ seconds }}
            components={[<a key="login-link" href={urls.getLoginUrl()} />]}
            />
        )}
      </Countdown>
    </React.Fragment>
  );

  const registrationFailureContent = () => (
    <React.Fragment>
      <p>{t('registrationFailure')}</p>
      <a href={urls.getHomeUrl()}>{t('homeLink')}</a>
    </React.Fragment>
  );

  return (
    <PageTemplate alerts={alerts} fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <SiteLogo size="big" readonly />
        </div>
        <div className="CompleteRegistrationPage-message">
          {initialState.user
            ? registrationSuccessContent()
            : registrationFailureContent()}
        </div>
      </div>
    </PageTemplate>
  );
}

CompleteRegistration.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: userShape
  }).isRequired
};

export default CompleteRegistration;

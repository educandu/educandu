import PropTypes from 'prop-types';
import Countdown from '../countdown.js';
import routes from '../../utils/routes.js';
import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { userShape } from '../../ui/default-prop-types.js';

function CompleteRegistration({ initialState, PageTemplate, SiteLogo }) {
  const { t } = useTranslation('completeRegistration');
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  useEffect(() => setIsCountdownRunning(true), []);

  const registrationSuccessContent = () => (
    <React.Fragment>
      <p>{t('registrationSuccess')}</p>
      <Countdown
        seconds={10}
        isRunning={isCountdownRunning}
        onComplete={() => {
          window.location = routes.getLoginUrl();
        }}
        >
        {seconds => (
          <Trans
            t={t}
            i18nKey="redirectMessage"
            values={{ seconds }}
            components={[<a key="login-link" href={routes.getLoginUrl()} />]}
            />
        )}
      </Countdown>
    </React.Fragment>
  );

  const registrationFailureContent = () => (
    <React.Fragment>
      <p>{t('registrationFailure')}</p>
      <a href={routes.getHomeUrl()}>{t('homeLink')}</a>
    </React.Fragment>
  );

  return (
    <PageTemplate fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <SiteLogo readonly />
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
  SiteLogo: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    user: userShape
  }).isRequired
};

export default CompleteRegistration;

import Page from '../page';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import Countdown from '../countdown';
import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { userShape } from '../../ui/default-prop-types';

function CompleteRegistration({ initialState }) {
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
    <Page fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="CompleteRegistrationPage-message">
          {initialState.user
            ? registrationSuccessContent()
            : registrationFailureContent()}
        </div>
      </div>
    </Page>
  );
}

CompleteRegistration.propTypes = {
  initialState: PropTypes.shape({
    user: userShape
  }).isRequired
};

export default CompleteRegistration;

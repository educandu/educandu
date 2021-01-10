import Page from '../page';
import urls from '../../utils/urls';
import ElmuLogo from '../elmu-logo';
import Countdown from '../countdown';
import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';

function CompleteRegistration() {
  const { t } = useTranslation('completeRegistration');
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  useEffect(() => setIsCountdownRunning(true), []);

  return (
    <Page fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="CompleteRegistrationPage-message">
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
        </div>
      </div>
    </Page>
  );
}

export default CompleteRegistration;

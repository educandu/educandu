const React = require('react');
const Page = require('../page');
const urls = require('../../utils/urls');
const ElmuLogo = require('../elmu-logo');
const Countdown = require('../countdown');

function CompleteRegistration() {
  const [isCountdownRunning, setIsCountdownRunning] = React.useState(false);
  React.useEffect(() => setIsCountdownRunning(true), []);

  const countdown = (
    <Countdown
      seconds={10}
      isRunning={isCountdownRunning}
      onComplete={() => {
        window.location = urls.getLoginUrl();
      }}
      />
  );

  return (
    <Page fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="CompleteRegistrationPage-message">
          <p>Gratulation! Sie sind nun ein elmu-User und haben Ihre Registrierung erfolgreich abgeschlossen.</p>
          <p>Sie werden in {countdown} auf die <a href={urls.getLoginUrl()}>Anmeldeseite</a> weitergeleitet.</p>
        </div>
      </div>
    </Page>
  );
}

module.exports = CompleteRegistration;

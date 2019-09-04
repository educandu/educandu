const React = require('react');
const Page = require('../page.jsx');
const ElmuLogo = require('../elmu-logo.jsx');

function CompleteRegistration() {
  return (
    <Page fullScreen>
      <div className="CompleteRegistrationPage">
        <div className="CompleteRegistrationPage-title">
          <ElmuLogo size="big" readonly />
        </div>
        <div className="CompleteRegistrationPage-message">
          <p>Gratulation! Sie sind nun ein elmu-User und haben Ihre Registrierung erfolgreich abgeschlossen.</p>
          <p>Klicken Sie bitte <a href="/login">hier</a>, wenn Sie sich anmelden möchten.</p>
        </div>
      </div>
    </Page>
  );
}

module.exports = CompleteRegistration;

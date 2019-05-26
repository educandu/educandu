const React = require('react');
const Page = require('../page.jsx');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');

function CompleteRegistration() {
  return (
    <Page fullScreen>
      <PageContent fullScreen>
        <div className="CompleteRegistrationPage">
          <h1 className="CompleteRegistrationPage-title">elmu</h1>
          <div className="CompleteRegistrationPage-message">
            <p>Gratulation! Sie sind nun ein elmu-User und haben Ihre Registrierung erfolgreich abgeschlossen.</p>
            <p>Klicken Sie bitte <a href="/login">hier</a>, wenn Sie sich anmelden möchten.</p>
          </div>
        </div>
      </PageContent>
      <PageFooter fullScreen />
    </Page>
  );
}

module.exports = CompleteRegistration;

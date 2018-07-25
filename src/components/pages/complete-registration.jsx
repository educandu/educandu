const React = require('react');
const Page = require('../page.jsx');
const PageContent = require('../page-content.jsx');

function CompleteRegistration() {
  return (
    <Page fullScreen>
      <PageContent>
        <div className="CompleteRegistrationPage">
          <h1 className="CompleteRegistrationPage-title">elmu</h1>
          <div className="CompleteRegistrationPage-message">
            <p>Ihre Registrierung ist erfolgreich abgeschlossen.</p>
            <p>Klicken Sie <a href="/login">hier</a>, um sich anzumelden.</p>
          </div>
        </div>
      </PageContent>
    </Page>
  );
}

module.exports = CompleteRegistration;

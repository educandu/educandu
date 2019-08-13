const React = require('react');
const Page = require('./page.jsx');
const PropTypes = require('prop-types');
const PageFooter = require('./page-footer.jsx');
const PageContent = require('./page-content.jsx');

function ErrorRoot({ error }) {
  return (
    <Page fullScreen>
      <PageContent fullScreen>
        <div className="ErrorRoot">
          <h1 className="ErrorRoot-status">{error.status}</h1>
          <h1 className="ErrorRoot-message">{error.displayMessage || error.message}</h1>
          <div className="ErrorRoot-back" dangerouslySetInnerHTML={{ __html: '<a onclick="window.history.back();">Zurück</a>' }} />
          {error.expose && error.stack && <pre className="ErrorRoot-stack">{error.stack}</pre>}
        </div>
      </PageContent>
      <PageFooter fullScreen />
    </Page>
  );
}

ErrorRoot.propTypes = {
  error: PropTypes.object.isRequired
};

module.exports = ErrorRoot;

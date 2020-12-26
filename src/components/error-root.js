import React from 'react';
import PropTypes from 'prop-types';
import ErrorPage from './error-page';

function ErrorRoot({ error }) {
  return (
    <ErrorPage>
      <div className="ErrorRoot">
        <h1 className="ErrorRoot-status">{error.status}</h1>
        <h1 className="ErrorRoot-message">{error.displayMessage || error.message}</h1>
        <div className="ErrorRoot-back" dangerouslySetInnerHTML={{ __html: '<a onclick="window.history.back();">Zurück</a>' }} />
        {error.expose && error.stack && <pre className="ErrorRoot-stack">{error.stack}</pre>}
      </div>
    </ErrorPage>
  );
}

ErrorRoot.propTypes = {
  error: PropTypes.object.isRequired
};

export default ErrorRoot;

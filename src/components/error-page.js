import React from 'react';
import urls from '../utils/urls';
import PropTypes from 'prop-types';

function ErrorPage({ error, i18n }) {
  return (
    <div className="ErrorPage">
      <header className="ErrorPage-headerArea">
        <div className="ErrorPage-header">
          <div className="ErrorPage-headerContent ErrorPage-headerContent--left" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--center" />
          <div className="ErrorPage-headerContent ErrorPage-headerContent--right" />
        </div>
      </header>
      <main className="ErrorPage-contentArea">
        <div className="ErrorPage-contentContainer">
          <div className="ErrorPage-content">
            <h1 className="ErrorPage-status">{error.status}</h1>
            <h1 className="ErrorPage-message">{error.displayMessage || error.message}</h1>
            <div className="ErrorPage-back" dangerouslySetInnerHTML={{ __html: `<a onclick="window.history.back();">${i18n.t('common:back')}</a>` }} />
            {error.expose && error.stack && <pre className="ErrorPage-stack">{error.stack}</pre>}
          </div>
        </div>
      </main>
      <footer className="ErrorPage-footer">
        <div className="ErrorPage-footerContent">
          <a href={urls.getArticleUrl('ueber-elmu')}>Über ELMU</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('organisation')}>Organisation</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsvertrag</a>
          <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          <a href={urls.getArticleUrl('datenschutz')}>Datenschutz</a>
        </div>
      </footer>
    </div>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.object.isRequired,
  i18n: PropTypes.object.isRequired
};

export default ErrorPage;

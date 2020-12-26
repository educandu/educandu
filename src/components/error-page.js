import React from 'react';
import urls from '../utils/urls';
import PropTypes from 'prop-types';

function ErrorPage({ children }) {
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
        <div className="ErrorPage-content">
          {children}
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
  children: PropTypes.node
};

ErrorPage.defaultProps = {
  children: null
};

export default ErrorPage;

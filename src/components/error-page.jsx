const React = require('react');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');

function Page({ children }) {
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

Page.propTypes = {
  children: PropTypes.node
};

Page.defaultProps = {
  children: null
};

module.exports = Page;

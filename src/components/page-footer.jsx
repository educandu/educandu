const React = require('react');
const urls = require('../utils/urls');

function PageFooter() {

  return (
    <footer className="PageFooter">
      <a href={urls.getArticleUrl('ueber-elmu')}>Über ELMU</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getArticleUrl('organisation')}>Organisation</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getArticleUrl('nutzungsvertrag')}>Nutzungsvertrag</a>
      <span>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
      <a href={urls.getArticleUrl('datenschutz')}>Datenschutz</a>
    </footer>
  );
}

module.exports = PageFooter;

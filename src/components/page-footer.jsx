const React = require('react');
const urls = require('../utils/urls');
const PropTypes = require('prop-types');
const classNames = require('classnames');

function PageFooter({ fullScreen }) {
  const classes = classNames({
    'PageFooter': true,
    'PageFooter--fullScreen': fullScreen
  });

  return (
    <footer className={classes}>
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

PageFooter.propTypes = {
  fullScreen: PropTypes.bool
};

PageFooter.defaultProps = {
  fullScreen: false
};

module.exports = PageFooter;

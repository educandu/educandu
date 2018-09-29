const React = require('react');
const urls = require('../utils/urls');
const Anchor = require('antd/lib/anchor');
const classNames = require('classnames');

const { Link } = Anchor;

function PageFooter() {
  const classes = classNames({
    PageFooter: true,
  });

  return (
    <footer className={classes}>
      <Anchor>
        <Link className="PageFooter-link" href={urls.getArticleUrl('ueber-elmu')} title="Über ELMU" />
        <Link className="PageFooter-link" href={urls.getArticleUrl('organisation')} title="Organisation" />
        <Link className="PageFooter-link" href={urls.getArticleUrl('nutzungsvertrag')} title="Nutzungsvertrag" />
        <Link className="PageFooter-link" href={urls.getArticleUrl('datenschutz')} title="Datenschutz" />
      </Anchor>
    </footer>
  );
}

module.exports = PageFooter;

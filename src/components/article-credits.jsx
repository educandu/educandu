const React = require('react');
const moment = require('moment');
const urls = require('../utils/urls.js');
const { useRequest } = require('./request-context.jsx');
const { docShape } = require('../ui/default-prop-types');

const locale = 'de-DE';

function ArticleCredits({ doc }) {
  const request = useRequest();
  const contributors = doc.contributors || [];

  const articleUrl = `${request.hostInfo.origin}${urls.getArticleUrl(doc.slug)}`;
  const citation = `Artikel »${doc.title}«, ${articleUrl}, ${moment().locale(locale).format('L, LT')}`;

  return (
    <div className="ArticleCredits">
      <p className="ArticleCredits-licence">
        <b>Lizenz:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a><br />
        <b>Quelle:</b> <i>{request.hostInfo.host}</i>, {citation}<br />
        <b>Bearbeitungen durch:</b> <span>{contributors.map(x => x.username).join(', ')}</span>
      </p>
    </div>
  );
}

ArticleCredits.propTypes = {
  doc: docShape.isRequired
};

module.exports = ArticleCredits;

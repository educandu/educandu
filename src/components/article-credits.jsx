const React = require('react');
const moment = require('moment');
const urls = require('../utils/urls.js');
const { docShape } = require('../ui/default-prop-types');

function ArticleCredits({ doc }) {
  const contributors = doc.contributors || [];

  const articleUrl = `https://elmu.online${urls.getArticleUrl(doc.slug)}`;
  const citation = `Artikel »${doc.title}«, ${articleUrl}, ${moment().locale('de-DE').format('DoMM.YYYY, h:mm')}`;

  return (
    <div className="ArticleCredits">
      <p className="ArticleCredits-licence">
        <b>Lizenz:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a><br />
        <b>Quelle:</b> <i>elmu.online</i>, {citation}<br />
        <b>Bearbeitungen durch:</b> <span>{contributors.map(x => x.username).join(', ')}</span>
      </p>
    </div>
  );
}

ArticleCredits.propTypes = {
  doc: docShape.isRequired
};

module.exports = ArticleCredits;

const React = require('react');
const moment = require('moment');
const { useRequest } = require('./request-context');
const { docShape } = require('../ui/default-prop-types');

const locale = 'de-DE';

function ArticleCredits({ doc }) {
  const request = useRequest();
  const contributors = doc.contributors || [];
  const currentHost = request.hostInfo.host;
  const currentUrl = `${request.hostInfo.origin}${request.path}`;
  const citation = `Artikel »${doc.title}«, ${currentUrl}, ${moment().locale(locale).format('L, LT')}`;

  return (
    <div className="ArticleCredits">
      <p className="ArticleCredits-licence">
        <b>Lizenz:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a>
        <br />
        <b>Quelle:</b> <i>{currentHost}</i>, {citation}
        <br />
        {!!contributors.length && <span><b>Bearbeitungen durch:</b> <span>{contributors.map(x => x.username).join(', ')}</span></span>}
      </p>
    </div>
  );
}

ArticleCredits.propTypes = {
  doc: docShape.isRequired
};

module.exports = ArticleCredits;

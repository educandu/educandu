const React = require('react');
const moment = require('moment');
const PropTypes = require('prop-types');
const urls = require('../utils/urls.js');
const { docShape, sectionShape } = require('../ui/default-prop-types');

function ArticleCredits({ doc, sections }) {
  const sectionSet = new Set();
  sections.forEach(section => sectionSet.add(section.createdBy.id));
  const authorsIds = Array.from(sectionSet);
  const hasMoreThanTenAuthors = authorsIds.length > 10;
  const contributedList = hasMoreThanTenAuthors
    ? <p className="ArticleCredits-authorString">{authorsIds.join(', ')}</p>
    : <ul className="ArticleCredits-authorList">{authorsIds.map(id => <li key={id}>{id}</li>)}</ul>;
  const articleUrl = `https://elmu.online'${urls.getArticleUrl(doc.slug)}`;
  const citation = `Artikel »${doc.title}«, ${articleUrl}, ${moment().locale('de-DE').format('DoMM.YYYY, h:mm')}`;

  return (
    <div className="ArticleCredits">
      <p className="ArticleCredits-licence">
        <b>Lizenz:</b> <a href="https://creativecommons.org/licenses/by-sa/3.0/de/deed.de">CC BY-SA 3.0 DE</a><br />
        <b>Quelle:</b> <i>elmu.online</i>, {citation}<br />
        <b>Bearbeitungen durch:</b>
      </p>
      {contributedList}
    </div>
  );
}

ArticleCredits.propTypes = {
  doc: docShape.isRequired,
  sections: PropTypes.arrayOf(sectionShape).isRequired
};

module.exports = ArticleCredits;

const React = require('react');
const Page = require('../page.jsx');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const DocView = require('../doc-view.jsx');
const permissions = require('../../domain/permissions');
const ArticleCredits = require('../article-credits.jsx');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

const handleBackClick = () => window.history.back();

function Article({ initialState, language }) {
  const { doc, sections } = initialState;

  const headerActions = React.useMemo(() => [
    {
      handleClick: () => {
        window.location = urls.getEditDocUrl(doc.key);
      },
      icon: 'edit',
      key: 'edit',
      permission: permissions.EDIT_DOC,
      text: 'Bearbeiten',
      type: 'primary'
    }
  ], [doc.key]);

  return (
    <Page headerActions={headerActions}>
      <aside className="Content">
        <a onClick={handleBackClick}>Zurück</a>
      </aside>
      <DocView doc={doc} sections={sections} language={language} />
      <ArticleCredits doc={doc} />
    </Page>
  );
}

Article.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

module.exports = Article;

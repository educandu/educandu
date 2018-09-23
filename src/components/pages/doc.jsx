const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const DocView = require('../doc-view.jsx');
const Restricted = require('../restricted.jsx');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { withUser } = require('../user-context.jsx');
const permissions = require('../../domain/permissions');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

class Doc extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleEditClick() {
    const { initialState } = this.props;
    const { doc } = initialState;
    window.location = urls.getEditDocUrl(doc.key);
  }

  render() {
    const { initialState, language } = this.props;
    const { doc, sections } = initialState;

    return (
      <Page>
        <PageHeader>
          <Restricted to={permissions.EDIT_DOC}>
            <Button type="primary" icon="edit" onClick={this.handleEditClick}>Bearbeiten</Button>
          </Restricted>
        </PageHeader>
        <PageContent>
          <div>
            <span>Titel:</span> <span>{doc.title}</span>
            <br />
            <span>URL-Pfad:</span> {doc.slug ? <span>{urls.getArticleUrl(doc.slug)}</span> : <i>(nicht zugewiesen)</i>}
          </div>
          <DocView doc={doc} sections={sections} language={language} />
        </PageContent>
      </Page>
    );
  }
}

Doc.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

module.exports = withUser(Doc);

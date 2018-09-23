const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const DocView = require('../doc-view.jsx');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { withUser } = require('../user-context.jsx');
const { userProps, docShape, sectionShape } = require('../../ui/default-prop-types');

class Article extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleEditClick() {
    const { initialState } = this.props;
    const { doc } = initialState;
    window.location = urls.getEditDocUrl(doc.key);
  }

  handleBackClick() {
    window.history.back();
  }

  render() {
    const { initialState, user, language } = this.props;
    const { doc, sections } = initialState;

    return (
      <Page>
        <PageHeader>
          {user && <Button type="primary" icon="edit" onClick={this.handleEditClick}>Bearbeiten</Button>}
        </PageHeader>
        <PageContent>
          <p><a onClick={this.handleBackClick}>Zurück</a></p>
          <DocView doc={doc} sections={sections} language={language} />
        </PageContent>
      </Page>
    );
  }
}

Article.propTypes = {
  ...userProps,
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

module.exports = withUser(Article);

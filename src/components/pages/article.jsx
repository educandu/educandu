const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const DocView = require('../doc-view.jsx');
const Restricted = require('../restricted.jsx');
const permissions = require('../../domain/permissions');
const { docShape, sectionShape } = require('../../ui/default-prop-types');

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
    const { initialState, language } = this.props;
    const { doc, sections } = initialState;

    const headerContent = (
      <aside>
        <Restricted to={permissions.EDIT_DOC}>
          <Button type="primary" icon="edit" onClick={this.handleEditClick}>Bearbeiten</Button>
        </Restricted>
      </aside>
    );

    return (
      <Page headerContent={headerContent}>
        <p><a onClick={this.handleBackClick}>Zurück</a></p>
        <DocView doc={doc} sections={sections} language={language} />
      </Page>
    );
  }
}

Article.propTypes = {
  initialState: PropTypes.shape({
    doc: docShape,
    sections: PropTypes.arrayOf(sectionShape)
  }).isRequired,
  language: PropTypes.string.isRequired
};

module.exports = Article;

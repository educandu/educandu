const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Logger = require('../../common/logger');
const Restricted = require('../restricted.jsx');
const PageHeader = require('../page-header.jsx');
const PageFooter = require('../page-footer.jsx');
const PageContent = require('../page-content.jsx');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const permissions = require('../../domain/permissions');
const { toTrimmedString } = require('../../utils/sanitize');
const DocumentApiClient = require('../../services/document-api-client');

const logger = new Logger(__filename);

const DEFAULT_DOCUMENT_TITLE = 'Neues Dokument';
const DEFAULT_DOCUMENT_SLUG = '';

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      isNewDocModalVisible: false,
      isLoading: false
    };
  }

  createNewDocument(title, slug) {
    return {
      doc: {
        title: toTrimmedString(title) || DEFAULT_DOCUMENT_TITLE,
        slug: toTrimmedString(slug) || null
      },
      sections: []
    };
  }

  handleNewDocumentClick() {
    this.setState({
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      isNewDocModalVisible: true
    });
  }

  handleNewDocTitleChange(event) {
    this.setState({ newDocTitle: event.target.value });
  }

  handleNewDocSlugChange(event) {
    this.setState({ newDocSlug: event.target.value });
  }

  async handleOk() {
    const { newDocTitle, newDocSlug } = this.state;
    const { documentApiClient } = this.props;

    try {
      this.setState({ isLoading: true });

      const newDoc = this.createNewDocument(newDocTitle, newDocSlug);
      const { doc } = await documentApiClient.saveDocument(newDoc);

      this.setState({
        isNewDocModalVisible: false,
        isLoading: false
      });

      window.location = urls.getDocUrl(doc.key);
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError(error, logger);
    }
  }

  handleCancel() {
    this.setState({ isNewDocModalVisible: false });
  }

  render() {
    const { initialState } = this.props;
    const { newDocTitle, newDocSlug, isNewDocModalVisible, isLoading } = this.state;
    return (
      <Page>
        <PageHeader>
          <Restricted to={permissions.EDIT_DOC}>
            <Button type="primary" icon="plus" onClick={this.handleNewDocumentClick}>Neues Dokument</Button>
          </Restricted>
        </PageHeader>
        <PageContent>
          <h1>Dokumente</h1>
          <ul>
            {initialState.map(doc => (
              <li key={doc._id}>
                <a href={urls.getDocUrl(doc._id)}>{doc.title}</a>
              </li>
            ))}
          </ul>
          <Modal
            title="Neues Dokument"
            visible={isNewDocModalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            >
            <p>Titel</p>
            <p><Input value={newDocTitle} onChange={this.handleNewDocTitleChange} /></p>
            <p>URL-Pfad</p>
            <p><Input addonBefore={urls.articlesPrefix} value={newDocSlug} onChange={this.handleNewDocSlugChange} /></p>
            {isLoading && <p>Wird erstellt ...</p>}
          </Modal>
        </PageContent>
        <PageFooter />
      </Page>
    );
  }
}

Docs.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  })).isRequired
};

module.exports = inject({
  documentApiClient: DocumentApiClient
}, Docs);

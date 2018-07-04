const React = require('react');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Button, Input, Modal } = require('antd');
const PageHeader = require('../page-header.jsx');
const PageContent = require('../page-content.jsx');
const { inject } = require('../container-context.jsx');
const DocumentApiClient = require('../../services/document-api-client');

const DEFAULT_DOCUMENT_TITLE = 'Neues Dokument';

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      isNewDocModalVisible: false,
      isLoading: false
    };
  }

  createNewDocument(title) {
    return {
      doc: {
        title: title || DEFAULT_DOCUMENT_TITLE
      },
      sections: [],
      user: {
        name: 'Mr. Browser'
      }
    };
  }

  handleNewDocumentClick() {
    this.setState({
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      isNewDocModalVisible: true
    });
  }

  handleNewDocTitleChange(event) {
    this.setState({ newDocTitle: event.target.value });
  }

  async handleOk() {
    const { newDocTitle } = this.state;
    const { documentApiClient } = this.props;

    this.setState({ isLoading: true });

    const { doc } = await documentApiClient.saveDocument(this.createNewDocument(newDocTitle));

    this.setState({
      isNewDocModalVisible: false,
      isLoading: false
    });

    window.location = `/edit/doc/${doc.key}`;
  }

  handleCancel() {
    this.setState({ isNewDocModalVisible: false });
  }

  render() {
    const { initialState } = this.props;
    const { newDocTitle, isNewDocModalVisible, isLoading } = this.state;
    return (
      <Page>
        <PageHeader>
          <Button type="primary" icon="plus" onClick={this.handleNewDocumentClick}>Neues Dokument</Button>
        </PageHeader>
        <PageContent>
          <h1>Dokumente</h1>
          <ul>
            {initialState.map(doc => (
              <li key={doc._id}>
                <a href={`/docs/${doc._id}`}>{doc.title}</a>
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
            {isLoading && <p>Wird erstellt ...</p>}
          </Modal>
        </PageContent>
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

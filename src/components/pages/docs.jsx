const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Button, Input, Modal } = require('antd');
const uniqueId = require('../../utils/unique-id');
const PageHeader = require('./../page-header.jsx');
const { inject } = require('../container-context.jsx');
const DocumentApiClient = require('../../services/document-api-client');

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      newDocKey: null,
      visible: false,
      loading: false
    };
  }

  createNewDocument(key, title) {
    return {
      doc: {
        key: key,
        title: title || 'Unbenannt'
      },
      sections: [],
      user: {
        name: 'Mr. Browser'
      }
    };
  }

  handleNewDocumentClick() {
    this.setState({
      newDocKey: uniqueId.create(),
      visible: true
    });
  }

  handleNewDocKeyChange(event) {
    this.setState({ newDocKey: event.target.value });
  }

  async handleOk() {
    const { newDocKey } = this.state;
    const { documentApiClient } = this.props;

    this.setState({ loading: true });

    await documentApiClient.saveDocument(this.createNewDocument(newDocKey));

    this.setState({
      newDocKey: null,
      visible: false,
      loading: false
    });
  }

  handleCancel() {
    this.setState({ visible: false });
  }

  render() {
    const { initialState } = this.props;
    const { newDocKey, visible, loading } = this.state;
    return (
      <React.Fragment>
        <PageHeader />
        <div className="PageContent">
          <h1>Docs</h1>
          <ul>
            {initialState.map(doc => (
              <li key={doc._id}>
                <a href={`/docs/${doc._id}`}>{doc.title}</a>
              </li>
            ))}
          </ul>
          <Button type="primary" shape="circle" icon="plus" size="large" onClick={this.handleNewDocumentClick} />
          <Modal
            title="Neues Dokument"
            visible={visible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            >
            <p>ID</p>
            <p><Input value={newDocKey} onChange={this.handleNewDocKeyChange} /></p>
            {loading && <p>Wird erstellt ...</p>}
          </Modal>
        </div>
      </React.Fragment>
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

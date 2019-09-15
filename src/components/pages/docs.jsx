const React = require('react');
const moment = require('moment');
const Page = require('../page.jsx');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const Modal = require('antd/lib/modal');
const Table = require('antd/lib/table');
const urls = require('../../utils/urls');
const Button = require('antd/lib/button');
const Logger = require('../../common/logger');
const Restricted = require('../restricted.jsx');
const errorHelper = require('../../ui/error-helper');
const { inject } = require('../container-context.jsx');
const permissions = require('../../domain/permissions');
const { toTrimmedString } = require('../../utils/sanitize');
const { docMetadataShape } = require('../../ui/default-prop-types');
const DocumentApiClient = require('../../services/document-api-client');

const logger = new Logger(__filename);

const DEFAULT_DOCUMENT_TITLE = 'Neues Dokument';
const DEFAULT_DOCUMENT_SLUG = '';
const DEFAULT_FILTER_INPUT = '';

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      filteredDocs: props.initialState.docs.slice(),
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      filterInput: DEFAULT_FILTER_INPUT,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      isNewDocModalVisible: false,
      isLoading: false,
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

  handleFilterInputChange(event) {
    const filterInput = event.target.value;
    const docs = this.props.initialState.docs;
    const filteredDocs = docs.filter(doc => doc.title.toLowerCase().includes(filterInput.toLowerCase()));
    console.log(filteredDocs);
    this.setState({ filteredDocs: filteredDocs, filterInput: filterInput });
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
    const { newDocTitle, newDocSlug, isNewDocModalVisible, isLoading, filterInput, filteredDocs } = this.state;
    console.log(filteredDocs);

    const columns = [
      {
        title: 'Name',
        dataIndex: 'title',
        key: 'title',
        render: (title, doc) => <a href={urls.getDocUrl(doc._id)}>{doc.title}</a>
      },{
        title: 'Update-Datum',
        dataIndex: 'udate',
        key: 'udate',
        render: (title, doc) => <span>{moment(doc.updatedOn).locale('de-DE').format('L')} - {moment(doc.updatedOn).locale('de-DE').format('LT')}</span>
      },
      {
        title: 'User-Info',
        dataIndex: 'user',
        key: 'user',
        render: (title, doc) => <span>{doc.updatedBy.username} | {doc.updatedBy.email}</span>
      }
    ];

    return (
      <Page>
        <div className="DocsPage">
          <h1>Dokumente</h1>
          <p><Input value={filterInput} onChange={this.handleFilterInputChange} /></p>
          <Table dataSource={filteredDocs} columns={columns} />
          <aside>
            <Restricted to={permissions.EDIT_DOC}>
              <Button type="primary" shape="circle" icon="plus" size="large" onClick={this.handleNewDocumentClick} />
            </Restricted>
          </aside>
          <Modal
            title="Neues Dokument"
            visible={isNewDocModalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            maskClosable={false}
            >
            <p>Titel</p>
            <p><Input value={newDocTitle} onChange={this.handleNewDocTitleChange} /></p>
            <p>URL-Pfad</p>
            <p><Input addonBefore={urls.articlesPrefix} value={newDocSlug} onChange={this.handleNewDocSlugChange} /></p>
            {isLoading && <p>Wird erstellt ...</p>}
          </Modal>
        </div>
      </Page>
    );
  }
}

Docs.propTypes = {
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    docs: PropTypes.arrayOf(docMetadataShape).isRequired
  }).isRequired
};

module.exports = inject({
  documentApiClient: DocumentApiClient
}, Docs);

import by from 'thenby';
import React from 'react';
import Page from '../page';
import moment from 'moment';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls';
import Restricted from '../restricted';
import Logger from '../../common/logger';
import { inject } from '../container-context';
import errorHelper from '../../ui/error-helper';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { Input, Modal, Table, Button } from 'antd';
import { toTrimmedString } from '../../utils/sanitize';
import { docMetadataShape } from '../../ui/default-prop-types';
import DocumentApiClient from '../../services/document-api-client';

const { Search } = Input;

const logger = new Logger(__filename);

const DEFAULT_DOCUMENT_TITLE = 'Neues Dokument';
const DEFAULT_DOCUMENT_SLUG = '';
const DEFAULT_FILTER_INPUT = '';

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      filteredDocs: props.initialState.docs.slice(),
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      filterInput: DEFAULT_FILTER_INPUT,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintSnapshotId: null,
      isNewDocModalVisible: false,
      isLoading: false
    };
  }

  createNewDocument(title, slug, blueprintDocSnapshotId) {
    return {
      doc: {
        title: toTrimmedString(title) || DEFAULT_DOCUMENT_TITLE,
        slug: toTrimmedString(slug) || null
      },
      sections: [],
      copySectionsFromRevision: blueprintDocSnapshotId || null
    };
  }

  handleNewDocumentClick() {
    this.setState({
      newDocTitle: DEFAULT_DOCUMENT_TITLE,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintSnapshotId: null,
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
    const filteredDocs = docs.filter(doc => {
      return doc.title.toLowerCase().includes(filterInput.toLowerCase())
        || doc.updatedBy.username.toLowerCase().includes(filterInput.toLowerCase());
    });
    this.setState({ filteredDocs, filterInput });
  }

  async handleOk() {
    const { newDocTitle, newDocSlug, newDocBlueprintSnapshotId } = this.state;
    const { documentApiClient } = this.props;

    try {
      this.setState({ isLoading: true });

      const newDoc = this.createNewDocument(newDocTitle, newDocSlug, newDocBlueprintSnapshotId);
      const { doc } = await documentApiClient.saveDocument(newDoc);

      this.setState({
        isNewDocModalVisible: false,
        isLoading: false
      });

      window.location = urls.getEditDocUrl(doc.key);
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError(error, logger);
    }
  }

  handleCancel() {
    this.setState({ isNewDocModalVisible: false });
  }

  handleCloneClick(doc) {
    this.setState({
      newDocTitle: doc.title ? `${doc.title} (Kopie)` : DEFAULT_DOCUMENT_TITLE,
      newDocSlug: doc.slug ? `${doc.slug}-kopie` : DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintSnapshotId: doc.snapshotId,
      isNewDocModalVisible: true
    });
  }

  renderTitle(title, doc) {
    return <a href={urls.getDocUrl(doc._id)}>{doc.title}</a>;
  }

  renderUpdatedOn(title, doc) {
    const date = moment(doc.updatedOn).locale('de-DE');
    return <span>{date.format('L')} - {date.format('LT')}</span>;
  }

  renderUpdatedBy(title, doc) {
    return doc.updatedBy.email
      ? <span>{doc.updatedBy.username} | <a href={`mailto:${doc.updatedBy.email}`}>E-Mail</a></span>
      : <span>{doc.updatedBy.username}</span>;
  }

  renderActions(title, doc) {
    return <span><a onClick={() => this.handleCloneClick(doc)}>Klonen</a></span>;
  }

  render() {
    const { newDocTitle, newDocSlug, isNewDocModalVisible, isLoading, filterInput, filteredDocs } = this.state;

    const columns = [
      {
        title: 'Name',
        dataIndex: 'title',
        key: 'title',
        render: this.renderTitle,
        sorter: by(x => x.title)
      },
      {
        title: 'Update-Datum',
        dataIndex: 'udate',
        key: 'udate',
        render: this.renderUpdatedOn,
        defaultSortOrder: 'descend',
        sorter: by(x => x.updatedOn)
      },
      {
        title: 'User-Info',
        dataIndex: 'user',
        key: 'user',
        render: this.renderUpdatedBy,
        sorter: by(x => x.updatedBy.username)
      },
      {
        title: 'Aktionen',
        dataIndex: 'actions',
        key: 'actions',
        render: this.renderActions
      }
    ];

    return (
      <Page>
        <div className="DocsPage">
          <h1>Dokumente</h1>
          <div className="DocsPage-search">
            <Search
              className="DocsPage-searchField"
              value={filterInput}
              onChange={this.handleFilterInputChange}
              placeholder="Suchbegriff eingeben"
              />
          </div>
          <Table dataSource={filteredDocs} columns={columns} size="middle" />
          <aside>
            <Restricted to={permissions.EDIT_DOC}>
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={this.handleNewDocumentClick} />
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

export default inject({
  documentApiClient: DocumentApiClient
}, Docs);

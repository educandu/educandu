import by from 'thenby';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { Fragment } from 'react';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { withTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withLanguage } from '../language-context.js';
import { withPageName } from '../page-name-context.js';
import { toTrimmedString } from '../../utils/sanitize.js';
import { DOCUMENT_ORIGIN } from '../../domain/constants.js';
import { getGlobalAlerts } from '../../ui/global-alerts.js';
import LanguageSelect from '../localization/language-select.js';
import { Form, Input, Modal, Table, Button, Switch } from 'antd';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { documentMetadataShape, translationProps, languageProps, pageNameProps } from '../../ui/default-prop-types.js';

const { Search } = Input;
const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const DEFAULT_FILTER_INPUT = '';
const DEFAULT_DOCUMENT_SLUG = '';

function getNewDocLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

class Docs extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.state = {
      filteredDocs: props.initialState.documents.slice(),
      newDoc: this.createNewDocumentState(this.props.langauge),
      filterInput: DEFAULT_FILTER_INPUT,
      isNewDocModalVisible: false,
      isLoading: false
    };
  }

  createNewDocumentState(uiLanguage) {
    return {
      title: this.props.t('defaultDocumentTitle'),
      slug: DEFAULT_DOCUMENT_SLUG,
      language: getNewDocLanguageFromUiLanguage(uiLanguage),
      blueprintKey: null,
      tags: []
    };
  }

  mapToDocumentModel(newDocState) {
    const { t } = this.props;
    return {
      title: toTrimmedString(newDocState.title) || t('defaultDocumentTitle'),
      slug: toTrimmedString(newDocState.slug) || '',
      language: newDocState.language,
      sections: [],
      tags: newDocState.tags ? [...newDocState.tags] : [],
      archived: false
    };
  }

  handleNewDocumentClick() {
    const { language } = this.props;
    this.setState({
      newDoc: this.createNewDocumentState(language),
      isNewDocModalVisible: true
    });
  }

  handleNewDocTitleChange(event) {
    const { value } = event.target;
    this.setState(prevState => ({ newDoc: { ...prevState.newDoc, title: value } }));
  }

  handleNewDocLanguageChange(value) {
    this.setState(prevState => ({ newDoc: { ...prevState.newDoc, language: value } }));
  }

  handleNewDocSlugChange(event) {
    const { value } = event.target;
    this.setState(prevState => ({ newDoc: { ...prevState.newDoc, slug: value } }));
  }

  handleFilterInputChange(event) {
    const filterInput = event.target.value;
    const docs = this.props.initialState.documents;
    const filteredDocs = docs.filter(doc => {

      return doc.title.toLowerCase().includes(filterInput.toLowerCase())
        || doc.updatedBy.username.toLowerCase().includes(filterInput.toLowerCase());
    });
    this.setState({ filteredDocs, filterInput });
  }

  async handleOk() {
    const { newDoc } = this.state;
    const { documentApiClient, t } = this.props;

    try {
      this.setState({ isLoading: true });

      const data = this.mapToDocumentModel(newDoc);

      const { documentRevision } = await documentApiClient.saveDocument(data);

      this.setState({
        isNewDocModalVisible: false,
        isLoading: false
      });

      window.location = urls.getEditDocUrl(documentRevision.key, newDoc.blueprintKey || null);
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  handleCancel() {
    this.setState({ isNewDocModalVisible: false });
  }

  handleCloneClick(doc) {
    const { t } = this.props;
    this.setState(prevState => ({
      newDoc: {
        ...prevState.newDoc,
        title: doc.title ? `${doc.title} ${t('copyTitleSuffix')}` : t('defaultDocumentTitle'),
        language: doc.language,
        slug: doc.slug ? `${doc.slug}-${t('copySlugSuffix')}` : DEFAULT_DOCUMENT_SLUG,
        tags: doc.tags ? [...doc.tags] : [],
        blueprintKey: doc.key
      },
      isNewDocModalVisible: true
    }));
  }

  async handleDocumentDelete(documentKey) {
    const { documentApiClient, t } = this.props;

    try {
      await documentApiClient.hardDeleteDocument(documentKey);

      this.setState(prevState => ({
        filteredDocs: prevState.filteredDocs.filter(doc => doc.key !== documentKey)
      }));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  handleDeleteClick(doc) {
    const { t } = this.props;
    confirmDocumentDelete(t, doc.title, () => this.handleDocumentDelete(doc.key));
  }

  async handleArchivedSwitchChange(archived, doc) {
    const { t } = this.props;
    const { filteredDocs } = this.state;

    try {
      this.setState({ isLoading: true });

      const { documentApiClient } = this.props;

      const { documentRevision } = archived
        ? await documentApiClient.unarchiveDocument(doc.key)
        : await documentApiClient.archiveDocument(doc.key);

      filteredDocs
        .filter(document => document.key === documentRevision.key)
        .forEach(document => {
          document.archived = documentRevision.archived;
        });

      this.setState({ filteredDocs, isLoading: false });
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError({ error, logger, t });
    }
  }

  renderTitle(title, doc) {
    return <a href={urls.getDocUrl(doc.key, doc.slug)}>{title}</a>;
  }

  renderUpdatedOn(updatedOn) {
    const { formatDate } = this.props;
    return <span>{formatDate(updatedOn)}</span>;
  }

  renderLanguage(documentLanguage) {
    const { languageNameProvider, language } = this.props;
    const lang = languageNameProvider.getData(language)[documentLanguage];
    return <CountryFlagAndName code={lang.flag} name={`${documentLanguage} (${lang.name})`} flagOnly />;
  }

  renderUpdatedBy(_user, doc) {
    const { t } = this.props;
    return doc.updatedBy.email
      ? <span>{doc.updatedBy.username} | <a href={`mailto:${doc.updatedBy.email}`}>{t('common:email')}</a></span>
      : <span>{doc.updatedBy.username}</span>;
  }

  renderOrigin(origin) {
    const { t } = this.props;
    let translatedOrigin = origin || '';

    if (origin === DOCUMENT_ORIGIN.internal) {
      translatedOrigin = t('originInternal');
    }
    if (origin.startsWith(DOCUMENT_ORIGIN.external)) {
      const nameOfOrigin = origin.split(DOCUMENT_ORIGIN.external)[1];
      translatedOrigin = `${t('originExternal')}${nameOfOrigin}`;
    }

    return <span>{translatedOrigin}</span>;
  }

  renderActions(_actions, doc) {
    const { t } = this.props;
    return (
      <Fragment>
        <span><a onClick={() => this.handleCloneClick(doc)}>{t('clone')}</a></span>
        {doc.origin.startsWith(DOCUMENT_ORIGIN.external) && (
          <Restricted to={permissions.MANAGE_IMPORT}>
            <br />
            <span><a onClick={() => this.handleDeleteClick(doc)}>{t('common:delete')}</a></span>
          </Restricted>
        )}
      </Fragment>
    );
  }

  renderArchived(archived, doc) {
    const disableArchiving = doc.origin !== DOCUMENT_ORIGIN.internal;
    return (
      <Switch
        size="small"
        checked={doc.archived}
        disabled={disableArchiving}
        onChange={() => this.handleArchivedSwitchChange(archived, doc)}
        />
    );
  }

  render() {
    const { t, user, pageName, PageTemplate } = this.props;
    const { filteredDocs, filterInput, newDoc, isNewDocModalVisible, isLoading } = this.state;

    const columns = [
      {
        title: t('title'),
        dataIndex: 'title',
        key: 'title',
        render: this.renderTitle,
        sorter: by(x => x.title)
      },
      {
        title: t('language'),
        dataIndex: 'language',
        key: 'language',
        render: this.renderLanguage,
        sorter: by(x => x.language)
      },
      {
        title: t('common:updatedOn'),
        dataIndex: 'updatedOn',
        key: 'updatedOn',
        render: this.renderUpdatedOn,
        defaultSortOrder: 'descend',
        sorter: by(x => x.updatedOn)
      },
      {
        title: t('user'),
        dataIndex: 'user',
        key: 'user',
        render: this.renderUpdatedBy,
        sorter: by(x => x.updatedBy.username)
      },
      {
        title: t('origin'),
        dataIndex: 'origin',
        key: 'origin',
        render: this.renderOrigin,
        sorter: by(x => x.origin)
      },
      {
        title: t('actions'),
        dataIndex: 'actions',
        key: 'actions',
        render: this.renderActions
      }
    ];

    if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
      columns.push({
        title: t('archived'),
        dataIndex: 'archived',
        key: 'archived',
        render: this.renderArchived,
        sorter: by(x => x.archived)
      });
    }

    const alerts = getGlobalAlerts(pageName, user);

    return (
      <PageTemplate alerts={alerts}>
        <div className="DocsPage">
          <h1>{t('pageNames:docs')}</h1>
          <div className="DocsPage-search">
            <Search
              className="DocsPage-searchField"
              value={filterInput}
              onChange={this.handleFilterInputChange}
              placeholder={t('enterSearchTerm')}
              />
          </div>
          <Table dataSource={filteredDocs} columns={columns} size="middle" />
          <aside>
            <Restricted to={permissions.EDIT_DOC}>
              <Button className="DocsPage-newDocumentButton" type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={this.handleNewDocumentClick} />
            </Restricted>
          </aside>
          <Modal
            title={t('newDocument')}
            visible={isNewDocModalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            maskClosable={false}
            okButtonProps={{ loading: isLoading }}
            >
            <Form name="new-document-form" layout="vertical">
              <FormItem label={t('title')}>
                <Input value={newDoc.title} onChange={this.handleNewDocTitleChange} />
              </FormItem>
              <FormItem label={t('language')}>
                <LanguageSelect value={newDoc.language} onChange={this.handleNewDocLanguageChange} />
              </FormItem>
              <FormItem label={t('slug')}>
                <Input addonBefore={urls.articlesPrefix} value={newDoc.slug} onChange={this.handleNewDocSlugChange} />
              </FormItem>
            </Form>
          </Modal>
        </div>
      </PageTemplate>
    );
  }
}

Docs.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  ...translationProps,
  ...languageProps,
  ...pageNameProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired
};

export default withTranslation('docs')(withLanguage(withUser(withPageName(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Docs)))));

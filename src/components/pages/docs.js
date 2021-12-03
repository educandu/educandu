import by from 'thenby';
import React from 'react';
import Page from '../page.js';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import { withUser } from '../user-context.js';
import { withTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import { inject } from '../container-context.js';
import errorHelper from '../../ui/error-helper.js';
import { withLanguage } from '../language-context.js';
import { toTrimmedString } from '../../utils/sanitize.js';
import { DOCUMENT_ORIGIN } from '../../common/constants.js';
import LanguageSelect from '../localization/language-select.js';
import { Form, Input, Modal, Table, Button, Switch } from 'antd';
import DocumentApiClient from '../../services/document-api-client.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { documentMetadataShape, translationProps, languageProps } from '../../ui/default-prop-types.js';

const { Search } = Input;
const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

const DEFAULT_DOCUMENT_NAMESPACE = 'articles';
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
      namespace: DEFAULT_DOCUMENT_NAMESPACE,
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

  renderTitle(_value, doc) {
    return <a href={urls.getDocUrl(doc.key)}>{doc.title}</a>;
  }

  renderSlug(_value, doc) {
    if (!doc.slug) {
      const { t } = this.props;
      return t('notAssigned');
    }

    const url = urls.getArticleUrl(doc.key, doc.slug);
    return <a href={url}>{url}</a>;
  }

  renderUpdatedOn(_value, doc) {
    const { formatDate } = this.props;
    return <span>{formatDate(doc.updatedOn)}</span>;
  }

  renderLanguage(_value, doc) {
    const { languageNameProvider, language } = this.props;
    const lang = languageNameProvider.getData(language)[doc.language];
    return <CountryFlagAndName code={lang.flag} name={`${doc.language} (${lang.name})`} flagOnly />;
  }

  renderUpdatedBy(_value, doc) {
    const { t } = this.props;
    return doc.updatedBy.email
      ? <span>{doc.updatedBy.username} | <a href={`mailto:${doc.updatedBy.email}`}>{t('email')}</a></span>
      : <span>{doc.updatedBy.username}</span>;
  }

  renderOrigin(_value, doc) {
    const { t } = this.props;
    const origin = doc.origin || '';
    let translatedOrigin = origin;

    if (origin === DOCUMENT_ORIGIN.internal) {
      translatedOrigin = t('originInternal');
    }
    if (origin.startsWith(DOCUMENT_ORIGIN.external)) {
      const nameOfOrigin = origin.split(DOCUMENT_ORIGIN.external)[1];
      translatedOrigin = `${t('originExternal')}${nameOfOrigin}`;
    }

    return <span>{translatedOrigin}</span>;
  }

  renderActions(_value, doc) {
    const { t } = this.props;
    return <span><a onClick={() => this.handleCloneClick(doc)}>{t('clone')}</a></span>;
  }

  renderArchived(value, doc) {
    return <Switch size="small" checked={doc.archived} onChange={() => this.handleArchivedSwitchChange(value, doc)} />;
  }

  render() {
    const { t, user } = this.props;
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
        title: t('slug'),
        dataIndex: 'slug',
        key: 'slug',
        render: this.renderSlug,
        sorter: by(x => x.slug)
      },
      {
        title: t('language'),
        dataIndex: 'language',
        key: 'language',
        render: this.renderLanguage,
        sorter: by(x => x.language)
      },
      {
        title: t('updateDate'),
        dataIndex: 'updateDate',
        key: 'updateDate',
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

    return (
      <Page>
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
              <Button type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={this.handleNewDocumentClick} />
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
      </Page>
    );
  }
}

Docs.propTypes = {
  ...translationProps,
  ...languageProps,
  documentApiClient: PropTypes.instanceOf(DocumentApiClient).isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired,
  languageNameProvider: PropTypes.instanceOf(LanguageNameProvider).isRequired
};

export default withTranslation('docs')(withLanguage(withUser(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Docs))));

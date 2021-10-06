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
import { withTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import permissions from '../../domain/permissions';
import { withLanguage } from '../language-context';
import { Input, Modal, Table, Button } from 'antd';
import { toTrimmedString } from '../../utils/sanitize';
import LanguageSelect from '../localization/language-select';
import DocumentApiClient from '../../services/document-api-client';
import LanguageNameProvider from '../../data/language-name-provider';
import CountryFlagAndName from '../localization/country-flag-and-name';
import { documentMetadataShape, translationProps, languageProps } from '../../ui/default-prop-types';

const { Search } = Input;

const logger = new Logger(__filename);

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
      newDocTitle: this.props.t('defaultDocumentTitle'),
      newDocLanguage: getNewDocLanguageFromUiLanguage(this.props.langauge),
      filterInput: DEFAULT_FILTER_INPUT,
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintKey: null,
      isNewDocModalVisible: false,
      isLoading: false
    };
  }

  createNewDocument(title, language, slug) {
    const { t } = this.props;
    return {
      title: toTrimmedString(title) || t('defaultDocumentTitle'),
      slug: toTrimmedString(slug) || '',
      namespace: DEFAULT_DOCUMENT_NAMESPACE,
      language,
      sections: []
    };
  }

  handleNewDocumentClick() {
    const { language, t } = this.props;
    this.setState({
      newDocTitle: t('defaultDocumentTitle'),
      newDocLanguage: getNewDocLanguageFromUiLanguage(language),
      newDocSlug: DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintKey: null,
      isNewDocModalVisible: true
    });
  }

  handleNewDocTitleChange(event) {
    this.setState({ newDocTitle: event.target.value });
  }

  handleNewDocLanguageChange(value) {
    this.setState({ newDocLanguage: value });
  }

  handleNewDocSlugChange(event) {
    this.setState({ newDocSlug: event.target.value });
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
    const { newDocTitle, newDocLanguage, newDocSlug, newDocBlueprintKey } = this.state;
    const { documentApiClient } = this.props;

    try {
      this.setState({ isLoading: true });

      const data = this.createNewDocument(newDocTitle, newDocLanguage, newDocSlug);
      const { documentRevision } = await documentApiClient.saveDocument(data);

      this.setState({
        isNewDocModalVisible: false,
        isLoading: false
      });

      window.location = urls.getEditDocUrl(documentRevision.key, newDocBlueprintKey || null);
    } catch (error) {
      this.setState({ isLoading: false });
      errorHelper.handleApiError(error, logger);
    }
  }

  handleCancel() {
    this.setState({ isNewDocModalVisible: false });
  }

  handleCloneClick(doc) {
    const { t } = this.props;
    this.setState({
      newDocTitle: doc.title ? `${doc.title} ${t('copyTitleSuffix')}` : t('defaultDocumentTitle'),
      newDocLanguage: doc.language,
      newDocSlug: doc.slug ? `${doc.slug}-${t('copySlugSuffix')}` : DEFAULT_DOCUMENT_SLUG,
      newDocBlueprintKey: doc.key,
      isNewDocModalVisible: true
    });
  }

  renderTitle(value, doc) {
    return <a href={urls.getDocUrl(doc.key)}>{doc.title}</a>;
  }

  renderUpdatedOn(value, doc) {
    const { locale } = this.props;
    const date = moment(doc.updatedOn).locale(locale);
    return <span>{date.format('L, LT')}</span>;
  }

  renderLanguage(value, doc) {
    const { languageNameProvider, language } = this.props;
    const lang = languageNameProvider.getData(language)[doc.language];
    return <CountryFlagAndName code={lang.flag} name={`${doc.language} (${lang.name})`} flagOnly />;
  }

  renderUpdatedBy(value, doc) {
    const { t } = this.props;
    return doc.updatedBy.email
      ? <span>{doc.updatedBy.username} | <a href={`mailto:${doc.updatedBy.email}`}>{t('email')}</a></span>
      : <span>{doc.updatedBy.username}</span>;
  }

  renderActions(value, doc) {
    const { t } = this.props;
    return <span><a onClick={() => this.handleCloneClick(doc)}>{t('clone')}</a></span>;
  }

  render() {
    const { t } = this.props;
    const { newDocTitle, newDocLanguage, newDocSlug, isNewDocModalVisible, isLoading, filterInput, filteredDocs } = this.state;

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
        title: t('udateDate'),
        dataIndex: 'udateDate',
        key: 'udateDate',
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
        title: t('actions'),
        dataIndex: 'actions',
        key: 'actions',
        render: this.renderActions
      }
    ];

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
            >
            <p>{t('title')}</p>
            <p><Input value={newDocTitle} onChange={this.handleNewDocTitleChange} /></p>
            <p>{t('language')}</p>
            <p><LanguageSelect value={newDocLanguage} onChange={this.handleNewDocLanguageChange} /></p>
            <p>{t('slug')}</p>
            <p><Input addonBefore={urls.articlesPrefix} value={newDocSlug} onChange={this.handleNewDocSlugChange} /></p>
            {isLoading && <p>{t('newDocumentProgress')}</p>}
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

export default withTranslation('docs')(withLanguage(inject({
  documentApiClient: DocumentApiClient,
  languageNameProvider: LanguageNameProvider
}, Docs)));

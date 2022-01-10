import by from 'thenby';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import React, { Fragment, useState } from 'react';
import errorHelper from '../../ui/error-helper.js';
import { useService } from '../container-context.js';
import { toTrimmedString } from '../../utils/sanitize.js';
import { DOCUMENT_ORIGIN } from '../../domain/constants.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import LanguageSelect from '../localization/language-select.js';
import { Form, Input, Modal, Table, Button, Switch } from 'antd';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import { documentMetadataShape } from '../../ui/default-prop-types.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';

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

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const alerts = useGlobalAlerts();
  const { language } = useLanguage();
  const { t } = useTranslation('docs');
  const { formatDate } = useDateFormat();
  const documentApiClient = useService(DocumentApiClient);
  const languageNameProvider = useService(LanguageNameProvider);

  const createNewDocumentState = uiLanguage => {
    return {
      title: t('defaultDocumentTitle'),
      slug: DEFAULT_DOCUMENT_SLUG,
      language: getNewDocLanguageFromUiLanguage(uiLanguage),
      blueprintKey: null,
      tags: []
    };
  };

  const [state, setState] = useState({
    filteredDocs: initialState.documents.slice(),
    newDoc: createNewDocumentState(language),
    filterInput: DEFAULT_FILTER_INPUT,
    isNewDocModalVisible: false,
    isLoading: false
  });

  const mapToDocumentModel = newDocState => {
    return {
      title: toTrimmedString(newDocState.title) || t('defaultDocumentTitle'),
      slug: toTrimmedString(newDocState.slug) || '',
      language: newDocState.language,
      sections: [],
      tags: newDocState.tags ? [...newDocState.tags] : [],
      archived: false
    };
  };

  const handleNewDocumentClick = () => {
    setState(prevState => ({ ...prevState, newDoc: createNewDocumentState(language), isNewDocModalVisible: true }));
  };

  const handleNewDocTitleChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, newDoc: { ...prevState.newDoc, title: value } }));
  };

  const handleNewDocLanguageChange = value => {
    setState(prevState => ({ ...prevState, newDoc: { ...prevState.newDoc, language: value } }));
  };

  const handleNewDocSlugChange = event => {
    const { value } = event.target;
    setState(prevState => ({ ...prevState, newDoc: { ...prevState.newDoc, slug: value } }));
  };

  const handleFilterInputChange = event => {
    const filterInput = event.target.value;
    const docs = initialState.documents;
    const filteredDocs = docs.filter(doc => doc.title.toLowerCase().includes(filterInput.toLowerCase())
      || doc.updatedBy.username.toLowerCase().includes(filterInput.toLowerCase()));
    setState(prevState => ({ ...prevState, filteredDocs, filterInput }));
  };

  const handleOk = async () => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));

      const data = mapToDocumentModel(state.newDoc);

      const { documentRevision } = await documentApiClient.saveDocument(data);

      setState(prevState => ({ ...prevState, isNewDocModalVisible: false, isLoading: false }));

      window.location = urls.getEditDocUrl(documentRevision.key, state.newDoc.blueprintKey || null);
    } catch (error) {
      setState(prevState => ({ ...prevState, isLoading: false }));
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleCancel = () => {
    setState(prevState => ({ ...prevState, isNewDocModalVisible: false }));
  };

  const handleCloneClick = doc => {
    setState(prevState => ({
      ...prevState,
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
  };

  const handleDocumentDelete = async documentKey => {
    try {
      await documentApiClient.hardDeleteDocument(documentKey);

      setState(prevState => ({
        ...prevState,
        filteredDocs: prevState.filteredDocs.filter(doc => doc.key !== documentKey)
      }));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleDeleteClick = doc => {
    confirmDocumentDelete(t, doc.title, () => handleDocumentDelete(doc.key));
  };

  const handleArchivedSwitchChange = async (archived, doc) => {
    try {
      setState(prevState => ({ ...prevState, isLoading: true }));

      const { documentRevision } = archived
        ? await documentApiClient.unarchiveDocument(doc.key)
        : await documentApiClient.archiveDocument(doc.key);

      state.filteredDocs
        .filter(document => document.key === documentRevision.key)
        .forEach(document => {
          document.archived = documentRevision.archived;
        });

      setState(prevState => ({ ...prevState, filteredDocs: state.filteredDocs, isLoading: false }));
    } catch (error) {
      setState(prevState => ({ ...prevState, isLoading: false }));
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const renderTitle = (title, doc) => {
    return <a href={urls.getDocUrl(doc.key, doc.slug)}>{title}</a>;
  };

  const renderUpdatedOn = updatedOn => {
    return <span>{formatDate(updatedOn)}</span>;
  };

  const renderLanguage = documentLanguage => {
    const lang = languageNameProvider.getData(language)[documentLanguage];
    return <CountryFlagAndName code={lang.flag} name={`${documentLanguage} (${lang.name})`} flagOnly />;
  };

  const renderUpdatedBy = (_user, doc) => {
    return doc.updatedBy.email
      ? <span>{doc.updatedBy.username} | <a href={`mailto:${doc.updatedBy.email}`}>{t('common:email')}</a></span>
      : <span>{doc.updatedBy.username}</span>;
  };

  const renderOrigin = origin => {
    let translatedOrigin = origin || '';

    if (origin === DOCUMENT_ORIGIN.internal) {
      translatedOrigin = t('originInternal');
    }
    if (origin.startsWith(DOCUMENT_ORIGIN.external)) {
      const nameOfOrigin = origin.split(DOCUMENT_ORIGIN.external)[1];
      translatedOrigin = `${t('originExternal')}${nameOfOrigin}`;
    }

    return <span>{translatedOrigin}</span>;
  };

  const renderActions = (_actions, doc) => {
    return (
      <Fragment>
        <span><a onClick={() => handleCloneClick(doc)}>{t('clone')}</a></span>
        {doc.origin.startsWith(DOCUMENT_ORIGIN.external) && (
          <Restricted to={permissions.MANAGE_IMPORT}>
            <br />
            <span><a onClick={() => handleDeleteClick(doc)}>{t('common:delete')}</a></span>
          </Restricted>
        )}
      </Fragment>
    );
  };

  const renderArchived = (archived, doc) => {
    const disableArchiving = doc.origin !== DOCUMENT_ORIGIN.internal;
    return (
      <Switch
        size="small"
        checked={doc.archived}
        disabled={disableArchiving}
        onChange={() => handleArchivedSwitchChange(archived, doc)}
        />
    );
  };

  const columns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderTitle,
      sorter: by(x => x.title)
    },
    {
      title: t('language'),
      dataIndex: 'language',
      key: 'language',
      render: renderLanguage,
      sorter: by(x => x.language)
    },
    {
      title: t('common:updatedOn'),
      dataIndex: 'updatedOn',
      key: 'updatedOn',
      render: renderUpdatedOn,
      defaultSortOrder: 'descend',
      sorter: by(x => x.updatedOn)
    },
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      render: renderUpdatedBy,
      sorter: by(x => x.updatedBy.username)
    },
    {
      title: t('origin'),
      dataIndex: 'origin',
      key: 'origin',
      render: renderOrigin,
      sorter: by(x => x.origin)
    },
    {
      title: t('actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions
    }
  ];

  if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
    columns.push({
      title: t('archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderArchived,
      sorter: by(x => x.archived)
    });
  }

  return (
    <PageTemplate alerts={alerts}>
      <div className="DocsPage">
        <h1>{t('pageNames:docs')}</h1>
        <div className="DocsPage-search">
          <Search
            className="DocsPage-searchField"
            value={state.filterInput}
            onChange={handleFilterInputChange}
            placeholder={t('enterSearchTerm')}
            />
        </div>
        <Table dataSource={state.filteredDocs} columns={columns} size="middle" />
        <aside>
          <Restricted to={permissions.EDIT_DOC}>
            <Button className="DocsPage-newDocumentButton" type="primary" shape="circle" icon={<PlusOutlined />} size="large" onClick={handleNewDocumentClick} />
          </Restricted>
        </aside>
        <Modal
          title={t('newDocument')}
          visible={state.isNewDocModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          maskClosable={false}
          okButtonProps={{ loading: state.isLoading }}
          >
          <Form name="new-document-form" layout="vertical">
            <FormItem label={t('common:title')}>
              <Input value={state.newDoc.title} onChange={handleNewDocTitleChange} />
            </FormItem>
            <FormItem label={t('language')}>
              <LanguageSelect value={state.newDoc.language} onChange={handleNewDocLanguageChange} />
            </FormItem>
            <FormItem label={t('slug')}>
              <Input addonBefore={urls.articlesPrefix} value={state.newDoc.slug} onChange={handleNewDocSlugChange} />
            </FormItem>
          </Form>
        </Modal>
      </div>
    </PageTemplate>
  );
}

Docs.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentMetadataShape).isRequired
  }).isRequired
};

export default Docs;

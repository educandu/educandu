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
import { Input, Table, Button, Switch } from 'antd';
import { useSettings } from '../settings-context.js';
import { DOCUMENT_ORIGIN } from '../../domain/constants.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import LanguageFlagAndName from '../language-flag-and-name.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import { documentMetadataShape } from '../../ui/default-prop-types.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';

const { Search } = Input;
const logger = new Logger(import.meta.url);

const DEFAULT_FILTER_INPUT = '';

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function getDefaultDocumentMetadata(t, uiLanguage) {
  return {
    title: t('newDocument'),
    slug: '',
    tags: [],
    language: getDefaultLanguageFromUiLanguage(uiLanguage)
  };
}

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const settings = useSettings();
  const alerts = useGlobalAlerts();
  const { t } = useTranslation('docs');
  const { formatDate } = useDateFormat();
  const { language: uiLanguage } = useLanguage();
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [modalState, setModalState] = useState({
    isVisible: false,
    initialDocumentMetadata: getDefaultDocumentMetadata(t, uiLanguage)
  });

  const [state, setState] = useState({
    filteredDocs: initialState.documents.slice(),
    filterInput: DEFAULT_FILTER_INPUT,
    isLoading: false
  });

  const handleFilterInputChange = event => {
    const filterInput = event.target.value;
    const docs = initialState.documents;
    const filteredDocs = docs.filter(doc => doc.title.toLowerCase().includes(filterInput.toLowerCase())
      || doc.updatedBy.username.toLowerCase().includes(filterInput.toLowerCase()));
    setState(prevState => ({ ...prevState, filteredDocs, filterInput }));
  };

  const handleNewDocumentClick = () => {
    setModalState({
      isVisible: true,
      templateDocumentKey: settings.templateDocument?.documentKey,
      initialDocumentMetadata: getDefaultDocumentMetadata(t, uiLanguage)
    });
  };

  const handleCloneClick = doc => {
    setModalState({
      isVisible: true,
      templateDocumentKey: null,
      initialDocumentMetadata: {
        title: `${doc.title} ${t('copyTitleSuffix')}`,
        slug: `${doc.slug}-${t('copySlugSuffix')}`,
        tags: [...doc.tags],
        language: doc.language
      }
    });
  };

  const handleDocumentMetadataModalSave = async ({ title, slug, language, tags, templateDocumentKey }) => {
    const { documentRevision } = await documentApiClient.saveDocument({ title, slug, language, tags, sections: [] });
    setModalState({
      isVisible: false,
      templateDocumentKey: settings.templateDocument?.documentKey,
      initialDocumentMetadata: getDefaultDocumentMetadata(t, uiLanguage)
    });

    window.location = urls.getEditDocUrl(documentRevision.key, templateDocumentKey || modalState.clonedDocument?.key);
  };

  const handleDocumentMetadataModalClose = () => {
    setModalState({
      isVisible: false,
      templateDocumentKey: settings.templateDocument?.documentKey,
      initialDocumentMetadata: getDefaultDocumentMetadata(t, uiLanguage)
    });
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
    return <LanguageFlagAndName language={documentLanguage} flagOnly />;
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
      title: t('common:language'),
      dataIndex: 'language',
      key: 'language',
      render: renderLanguage,
      sorter: by(x => x.language),
      responsive: ['sm']
    },
    {
      title: t('common:updatedOn'),
      dataIndex: 'updatedOn',
      key: 'updatedOn',
      render: renderUpdatedOn,
      defaultSortOrder: 'descend',
      sorter: by(x => x.updatedOn),
      responsive: ['lg']
    },
    {
      title: t('user'),
      dataIndex: 'user',
      key: 'user',
      render: renderUpdatedBy,
      sorter: by(x => x.updatedBy.username),
      responsive: ['md']
    },
    {
      title: t('origin'),
      dataIndex: 'origin',
      key: 'origin',
      render: renderOrigin,
      sorter: by(x => x.origin),
      responsive: ['lg']
    },
    {
      title: t('archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderArchived,
      sorter: by(x => x.archived),
      responsive: ['lg'],
      needsPermission: permissions.MANAGE_ARCHIVED_DOCS
    },
    {
      title: t('actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions
    }
  ].filter(column => !column.needsPermission || hasUserPermission(user, column.needsPermission));

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
        <DocumentMetadataModal
          initialDocumentMetadata={modalState.initialDocumentMetadata}
          isVisible={modalState.isVisible}
          templateDocumentKey={modalState.templateDocumentKey}
          mode={DOCUMENT_METADATA_MODAL_MODE.create}
          onSave={handleDocumentMetadataModalSave}
          onClose={handleDocumentMetadataModalClose}
          />
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

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
import { useService } from '../container-context.js';
import { DOCUMENT_ORIGIN } from '../../domain/constants.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import { documentMetadataShape } from '../../ui/default-prop-types.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import DocumentCreationModal from '../document-creation-modal.js';

const { Search } = Input;
const logger = new Logger(import.meta.url);

const DEFAULT_FILTER_INPUT = '';

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const alerts = useGlobalAlerts();
  const { language } = useLanguage();
  const { t } = useTranslation('docs');
  const { formatDate } = useDateFormat();
  const documentApiClient = useService(DocumentApiClient);
  const languageNameProvider = useService(LanguageNameProvider);

  const [modalState, setModalState] = useState({
    isVisible: false,
    clonedDocument: null
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
    setModalState({ isVisible: true, clonedDocument: null });
  };

  const handleCloneClick = doc => {
    setModalState({ isVisible: true, clonedDocument: doc });
  };

  const handleDocumentCreationModalClose = () => {
    setModalState({ isVisible: false, clonedDocument: null });
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
      title: t('common:language'),
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
        <DocumentCreationModal
          isVisible={modalState.isVisible}
          clonedDocument={modalState.clonedDocument}
          onClose={handleDocumentCreationModalClose}
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

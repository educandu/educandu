import by from 'thenby';
import Table from '../table.js';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { Input, Button, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import errorHelper from '../../ui/error-helper.js';
import { useSettings } from '../settings-context.js';
import SortingSelector from '../sorting-selector.js';
import DocumentInfoCell from '../document-info-cell.js';
import LanguageIcon from '../localization/language-icon.js';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { documentMetadataShape } from '../../ui/default-prop-types.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { DOCUMENT_ORIGIN, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentMetadataModal, { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal.js';

const { Search } = Input;
const logger = new Logger(import.meta.url);

function getDefaultLanguageFromUiLanguage(uiLanguage) {
  switch (uiLanguage) {
    case 'de': return 'de';
    default: return 'en';
  }
}

function getDefaultModalState({ t, uiLanguage, settings }) {
  return {
    isVisible: false,
    mode: DOCUMENT_METADATA_MODAL_MODE.create,
    templateDocumentKey: settings.templateDocument?.documentKey,
    initialDocumentMetadata: {
      title: t('newDocument'),
      description: '',
      slug: '',
      tags: [],
      language: getDefaultLanguageFromUiLanguage(uiLanguage)
    }
  };
}

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const settings = useSettings();
  const { t } = useTranslation('docs');
  const { uiLanguage } = useLocale();
  const [clonedDocument, setClonedDocument] = useState(null);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [searchText, setSearchText] = useState('');
  const [displayedDocuments, setDisplayedDocuments] = useState([]);
  const [documents, setDocuments] = useState(initialState.documents);
  const [sorting, setSorting] = useState({ value: 'title', direction: 'desc' });
  const [modalState, setModalState] = useState(getDefaultModalState({ t, uiLanguage, settings }));

  const sortingOptions = [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:user'), appliedLabel: t('common:sortedByUser'), value: 'user' },
    { label: t('common:origin'), appliedLabel: t('common:sortedByOrigin'), value: 'origin' },
    { label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' }
  ];

  const sorters = useMemo(() => ({
    title: documentsToSort => documentsToSort.sort(by(doc => doc.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: documentsToSort => documentsToSort.sort(by(doc => doc.createdOn, sorting.direction)),
    updatedOn: documentsToSort => documentsToSort.sort(by(doc => doc.updatedOn, sorting.direction)),
    language: documentsToSort => documentsToSort.sort(by(doc => doc.language, sorting.direction)),
    user: documentsToSort => documentsToSort.sort(by(doc => doc.createdBy.username, { direction: sorting.direction, ignoreCase: true })),
    origin: documentsToSort => documentsToSort.sort(by(doc => doc.origin, { direction: sorting.direction, ignoreCase: true })),
    archived: documentsToSort => documentsToSort.sort(by(doc => doc.archived, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    const newDocuments = documents.slice();
    const sorter = sorters[sorting.value];

    const filteredDocuments = searchText
      ? newDocuments.filter(doc => doc.title.toLowerCase().includes(searchText.toLowerCase())
        || doc.updatedBy.username.toLowerCase().includes(searchText.toLowerCase()))
      : newDocuments;
    const sortedDocuments = sorter ? sorter(filteredDocuments) : filteredDocuments;

    setDisplayedDocuments(sortedDocuments);
  }, [documents, sorting, searchText, sorters]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const handleSearchChange = event => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
  };

  const handleNewDocumentClick = () => {
    setClonedDocument(null);
    setModalState({
      ...getDefaultModalState({ t, uiLanguage, settings }),
      isVisible: true
    });
  };

  const handleCloneClick = doc => {
    setClonedDocument(doc);
    setModalState({
      isVisible: true,
      templateDocumentKey: null,
      initialDocumentMetadata: {
        title: `${doc.title} ${t('copyTitleSuffix')}`,
        description: doc.description,
        slug: doc.slug ? `${doc.slug}-${t('copySlugSuffix')}` : '',
        tags: [...doc.tags],
        language: doc.language
      }
    });
  };

  const handleDocumentMetadataModalSave = async ({ title, description, slug, language, tags, templateDocumentKey }) => {
    const newDocument = await documentApiClient.createDocument({ title, description, slug, language, tags });
    setModalState(getDefaultModalState({ t, uiLanguage, settings }));

    window.location = urls.getDocUrl({
      key: newDocument.key,
      slug: newDocument.slug,
      view: DOC_VIEW_QUERY_PARAM.edit,
      templateDocumentKey: templateDocumentKey || clonedDocument?.key
    });
  };

  const handleDocumentMetadataModalClose = () => {
    setModalState(getDefaultModalState({ t, uiLanguage, settings }));
  };

  const handleDocumentDelete = async documentKey => {
    try {
      await documentApiClient.hardDeleteDocument(documentKey);
      setDocuments(documents.filter(doc => doc.key !== documentKey));
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const handleDeleteClick = doc => {
    confirmDocumentDelete(t, doc.title, () => handleDocumentDelete(doc.key));
  };

  const handleArchivedSwitchChange = async (archived, doc) => {
    try {
      const { documentRevision } = archived
        ? await documentApiClient.unarchiveDocument(doc.key)
        : await documentApiClient.archiveDocument(doc.key);

      const newDocuments = documents.slice();
      newDocuments
        .filter(document => document.key === documentRevision.key)
        .forEach(document => { document.archived = documentRevision.archived; });

      setDocuments(newDocuments);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const renderTitle = (title, doc) => <DocumentInfoCell doc={doc} />;

  const renderLanguage = documentLanguage => {
    return <LanguageIcon language={documentLanguage} />;
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
      render: renderTitle
    },
    {
      title: t('common:language'),
      dataIndex: 'language',
      key: 'language',
      render: renderLanguage,
      responsive: ['sm']
    },
    {
      title: t('common:user'),
      dataIndex: 'user',
      key: 'user',
      render: renderUpdatedBy,
      responsive: ['md']
    },
    {
      title: t('common:origin'),
      dataIndex: 'origin',
      key: 'origin',
      render: renderOrigin,
      responsive: ['lg']
    },
    {
      title: t('common:archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderArchived,
      responsive: ['lg'],
      needsPermission: permissions.MANAGE_ARCHIVED_DOCS
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions
    }
  ].filter(column => !column.needsPermission || hasUserPermission(user, column.needsPermission));

  return (
    <PageTemplate>
      <div className="DocsPage">
        <h1>{t('pageNames:docs')}</h1>
        <div className="DocsPage-controls">
          <Search
            size="large"
            className="DocsPage-search"
            value={searchText}
            enterButton={<SearchOutlined />}
            onChange={handleSearchChange}
            placeholder={t('common:searchPlaceholder')}
            />
          <SortingSelector
            size="large"
            sorting={sorting}
            options={sortingOptions}
            onChange={handleSortingChange}
            />
        </div>
        <Table dataSource={[...displayedDocuments]} columns={columns} pagination />
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

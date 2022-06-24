import by from 'thenby';
import Table from '../table.js';
import PropTypes from 'prop-types';
import urls from '../../utils/routes.js';
import Restricted from '../restricted.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import errorHelper from '../../ui/error-helper.js';
import { useSettings } from '../settings-context.js';
import SortingSelector from '../sorting-selector.js';
import { Input, Button, Switch, Tooltip } from 'antd';
import DocumentInfoCell from '../document-info-cell.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import LanguageIcon from '../localization/language-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmDocumentDelete } from '../confirmation-dialogs.js';
import { documentMetadataShape } from '../../ui/default-prop-types.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const getOriginTranslated = ({ t, origin }) => {
  if (origin === DOCUMENT_ORIGIN.internal) {
    return t('originInternal');
  }

  if (origin.startsWith(DOCUMENT_ORIGIN.external)) {
    const nameOfOrigin = origin.split(DOCUMENT_ORIGIN.external)[1];
    return `${t('originExternal')}${nameOfOrigin}`;
  }

  return origin || '';
};

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const settings = useSettings();
  const { t } = useTranslation('docs');
  const { uiLanguage } = useLocale();
  const [clonedDocument, setClonedDocument] = useState(null);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const mapToRows = useCallback(docs => docs.map(doc => (
    {
      key: doc.key,
      title: doc.title,
      createdOn: doc.createdOn,
      updatedOn: doc.updatedOn,
      createdBy: doc.createdBy,
      language: doc.language,
      user: doc.user,
      origin: doc.origin,
      originTranslated: getOriginTranslated({ t, origin: doc.origin }),
      archived: doc.archived
    })), [t]);

  const [filterText, setFilterText] = useState('');
  const [displayedRows, setDisplayedRows] = useState([]);
  const [documents, setDocuments] = useState(initialState.documents);
  const [sorting, setSorting] = useState({ value: 'title', direction: 'desc' });
  const [modalState, setModalState] = useState(getDefaultModalState({ t, uiLanguage, settings }));

  const sortingOptions = [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:user'), appliedLabel: t('common:sortedByUser'), value: 'user' },
    { label: t('common:origin'), appliedLabel: t('common:sortedByOrigin'), value: 'origin' }
  ];

  if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
    sortingOptions.push({ label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' });
  }

  const sorters = useMemo(() => ({
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, sorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.language, sorting.direction)),
    user: rowsToSort => rowsToSort.sort(by(row => row.createdBy.username, { direction: sorting.direction, ignoreCase: true })),
    origin: rowsToSort => rowsToSort.sort(by(row => row.origin, { direction: sorting.direction, ignoreCase: true })),
    archived: rowsToSort => rowsToSort.sort(by(row => row.archived, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    const newRows = mapToRows(documents.slice());
    const sorter = sorters[sorting.value];

    const filteredRows = filterText
      ? newRows.filter(row => row.title.toLowerCase().includes(filterText.toLowerCase())
        || row.createdBy.username.toLowerCase().includes(filterText.toLowerCase()))
      : newRows;
    const sortedRows = sorter ? sorter(filteredRows) : filteredRows;

    setDisplayedRows(sortedRows);
  }, [documents, sorting, filterText, sorters, mapToRows]);

  const handleSortingChange = ({ value, direction }) => setSorting({ value, direction });

  const handleSearchChange = event => {
    const newFilterText = event.target.value;
    setFilterText(newFilterText);
  };

  const handleNewDocumentClick = () => {
    setClonedDocument(null);
    setModalState({
      ...getDefaultModalState({ t, uiLanguage, settings }),
      isVisible: true
    });
  };

  const handleCloneClick = row => {
    const doc = documents.find(d => d.key === row.key);
    setClonedDocument(doc);
    setModalState({
      isVisible: true,
      templateDocumentKey: null,
      initialDocumentMetadata: {
        title: `${doc.title} ${t('common:copyTitleSuffix')}`,
        description: doc.description,
        slug: doc.slug ? `${doc.slug}-${t('common:copySlugSuffix')}` : '',
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

  const handleDeleteClick = row => {
    confirmDocumentDelete(t, row.title, () => handleDocumentDelete(row.key));
  };

  const handleArchivedSwitchChange = async (archived, row) => {
    try {
      const { documentRevision } = archived
        ? await documentApiClient.unarchiveDocument(row.key)
        : await documentApiClient.archiveDocument(row.key);

      const newDocuments = documents.slice();
      newDocuments
        .filter(document => document.key === documentRevision.key)
        .forEach(document => { document.archived = documentRevision.archived; });

      setDocuments(newDocuments);
    } catch (error) {
      errorHelper.handleApiError({ error, logger, t });
    }
  };

  const renderOrigin = originTranslated => <span>{originTranslated}</span>;
  const renderLanguage = documentLanguage => <LanguageIcon language={documentLanguage} />;
  const renderTitle = (title, row) => {
    const doc = documents.find(d => d.key === row.key);
    return !!doc && <DocumentInfoCell doc={doc} />;
  };

  const renderCreatedBy = (_user, row) => {
    return row.createdBy.email
      ? <span>{row.createdBy.username} | <a href={`mailto:${row.createdBy.email}`}>{t('common:email')}</a></span>
      : <span>{row.createdBy.username}</span>;
  };

  const renderActions = (_actions, row) => {
    return (
      <div className="DocsPage-actions">
        <Tooltip title={t('common:clone')}>
          <a
            className="DocsPage-action DocsPage-action--clone"
            onClick={() => handleCloneClick(row)}
            >
            <DuplicateIcon />
          </a>
        </Tooltip>
        {row.origin.startsWith(DOCUMENT_ORIGIN.external) && (
          <Restricted to={permissions.MANAGE_IMPORT}>
            <Tooltip title={t('common:delete')}>
              <a
                className="DocsPage-action DocsPage-action--delete"
                onClick={() => handleDeleteClick(row)}
                >
                <DeleteIcon />
              </a>
            </Tooltip>
          </Restricted>
        )}
      </div>
    );
  };

  const renderArchived = (archived, row) => {
    const disableArchiving = row.origin !== DOCUMENT_ORIGIN.internal;
    return (
      <Switch
        size="small"
        checked={row.archived}
        disabled={disableArchiving}
        onChange={() => handleArchivedSwitchChange(archived, row)}
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
      responsive: ['sm'],
      width: '100px'
    },
    {
      title: t('initialAuthor'),
      dataIndex: 'user',
      key: 'user',
      render: renderCreatedBy,
      responsive: ['md'],
      width: '200px'
    },
    {
      title: t('common:origin'),
      dataIndex: 'originTranslated',
      key: 'originTranslated',
      render: renderOrigin,
      responsive: ['lg'],
      width: '200px'
    },
    {
      title: t('common:archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderArchived,
      responsive: ['lg'],
      needsPermission: permissions.MANAGE_ARCHIVED_DOCS,
      width: '100px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions,
      width: '100px'
    }
  ].filter(column => !column.needsPermission || hasUserPermission(user, column.needsPermission));

  return (
    <PageTemplate>
      <div className="DocsPage">
        <h1>{t('pageNames:docs')}</h1>
        <div className="DocsPage-controls">
          <Search
            size="large"
            className="DocsPage-filter"
            value={filterText}
            enterButton={<SearchOutlined />}
            onChange={handleSearchChange}
            placeholder={t('filterPlaceholder')}
            />
          <SortingSelector size="large" sorting={sorting} options={sortingOptions} onChange={handleSortingChange} />
        </div>
        <Table dataSource={[...displayedRows]} columns={columns} pagination />
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

import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import { Switch, Tabs, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import DocumentsTable from '../documents-table.js';
import SortingSelector from '../sorting-selector.js';
import CloseIcon from '../icons/general/close-icon.js';
import DocumentInfoCell from '../document-info-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import LanguageIcon from '../localization/language-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { CheckOutlined, LikeOutlined } from '@ant-design/icons';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentTagsForceGraph from '../../document-tags-force-graph.js';

const logger = new Logger(import.meta.url);

const TABS = {
  documents: 'documents',
  documentTags: 'document-tags'
};

const determineTab = query => Object.values(TABS).find(val => val === query) || Object.keys(TABS)[0];

function getDocumentMetadataModalState({ t, documentToClone = null, isOpen = false }) {
  return {
    mode: documentToClone ? DOCUMENT_METADATA_MODAL_MODE.clone : DOCUMENT_METADATA_MODAL_MODE.create,
    allowMultiple: false,
    isOpen,
    documentToClone,
    initialDocumentMetadata: documentToClone
      ? {
        ...documentToClone,
        title: `${documentToClone.title} ${t('common:copyTitleSuffix')}`,
        slug: documentToClone.slug ? `${documentToClone.slug}-${t('common:copySlugSuffix')}` : '',
        tags: [...documentToClone.tags]
      }
      : {}
  };
}

function Redaction({ initialState, PageTemplate }) {
  const user = useUser();
  const request = useRequest();
  const { t } = useTranslation('redaction');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const [currentTab, setCurrentTab] = useState(determineTab(request.query.tab));

  const changeTab = tab => {
    setCurrentTab(tab);
    history.replaceState(null, '', routes.getRedactionUrl({ tab }));
  };

  const handleTabChange = newKey => {
    changeTab(newKey);
  };

  const mapDocumentToRows = useCallback(docs => docs.map(doc => (
    {
      key: doc._id,
      _id: doc._id,
      documentId: doc._id,
      title: doc.title,
      createdOn: doc.createdOn,
      updatedOn: doc.updatedOn,
      createdBy: doc.createdBy,
      language: doc.language,
      user: doc.user,
      archived: doc.publicContext.archived,
      verified: doc.publicContext.verified,
      allowedOpenContribution: doc.publicContext.allowedOpenContribution
    })), []);

  const [documentsFilterText, setDocumentsFilterText] = useState('');
  const [documents, setDocuments] = useState(initialState.documents);
  const [displayedDocumentRows, setDisplayedDocumentRows] = useState([]);
  const [documentsSorting, setDocumentsSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));

  const documentsSortingOptions = [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:user'), appliedLabel: t('common:sortedByUser'), value: 'user' }
  ];

  if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
    documentsSortingOptions.push({ label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' });
  }

  const documentsSorters = useMemo(() => ({
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: documentsSorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, documentsSorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, documentsSorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.language, documentsSorting.direction)),
    user: rowsToSort => rowsToSort.sort(by(row => row.createdBy.displayName, { direction: documentsSorting.direction, ignoreCase: true })),
    archived: rowsToSort => rowsToSort.sort(by(row => row.archived, documentsSorting.direction))
  }), [documentsSorting.direction]);

  useEffect(() => {
    const newDocumentRows = mapDocumentToRows(documents.slice());
    const sorter = documentsSorters[documentsSorting.value];

    const filteredDocumentRows = documentsFilterText
      ? newDocumentRows.filter(row => row.title.toLowerCase().includes(documentsFilterText.toLowerCase())
        || row.createdBy.displayName.toLowerCase().includes(documentsFilterText.toLowerCase()))
      : newDocumentRows;
    const sortedRows = sorter ? sorter(filteredDocumentRows) : filteredDocumentRows;

    setDisplayedDocumentRows(sortedRows);
  }, [documents, documentsSorting, documentsFilterText, documentsSorters, mapDocumentToRows]);

  const handleDocumentsSortingChange = ({ value, direction }) => setDocumentsSorting({ value, direction });

  const handleDocumentsSearchChange = event => {
    const newFilterText = event.target.value;
    setDocumentsFilterText(newFilterText);
  };

  const handleDocumentCloneClick = row => {
    const documentToClone = documents.find(d => d._id === row.documentId);
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, documentToClone, isOpen: true }));
  };

  const handleDocumentMetadataModalSave = (createdDocuments, templateDocumentId) => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));

    const clonedOrTemplateDocumentId = documentMetadataModalState.cloneDocumentId || templateDocumentId;
    window.location = routes.getDocUrl({
      id: createdDocuments[0]._id,
      slug: createdDocuments[0].slug,
      view: DOC_VIEW_QUERY_PARAM.edit,
      templateDocumentId: clonedOrTemplateDocumentId
    });
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDocumentArchivedSwitchChange = async (archived, row) => {
    try {
      const { doc } = archived
        ? await documentApiClient.unarchiveDocument(row.documentId)
        : await documentApiClient.archiveDocument(row.documentId);

      const newDocuments = documents.slice();
      newDocuments
        .filter(document => document._id === doc._id)
        .forEach(document => { document.publicContext.archived = doc.publicContext.archived; });

      setDocuments(newDocuments);
    } catch (error) {
      handleApiError({ error, logger, t });
    }
  };

  const renderDocumentLanguage = documentLanguage => <LanguageIcon language={documentLanguage} />;

  const renderDocumentTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return <DocumentInfoCell doc={doc} />;
  };

  const renderDocumentCreatedBy = (_user, row) => {
    return <a href={routes.getUserProfileUrl(row.createdBy._id)}>{row.createdBy.displayName}</a>;
  };

  const renderDocumentActions = (_actions, row) => {
    return (
      <div className="RedactionPage-actions">
        <ActionButtonGroup>
          <ActionButton
            title={t('common:duplicate')}
            icon={<DuplicateIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleDocumentCloneClick(row)}
            />
        </ActionButtonGroup>
      </div>
    );
  };

  const renderDocumentArchived = (archived, row) => {
    return (
      <Switch
        size="small"
        checked={row.archived}
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseIcon />}
        onChange={() => handleDocumentArchivedSwitchChange(archived, row)}
        />
    );
  };

  const renderDocumentBadges = (_, row) => {
    return (
      <div className="RedactionPage-documentBadges">
        {!!row.verified && (
          <Tooltip title={t('common:verifiedDocumentBadge')}>
            <LikeOutlined className="u-verified-badge" />
          </Tooltip>
        )}
        {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content && (
          <Tooltip title={t('allowedOpenContributionBadge_content')}>
            <div className="u-badge">
              C
            </div>
          </Tooltip>
        )}
        {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent && (
          <Tooltip title={t('allowedOpenContributionBadge_metadataAndContent')}>
            <div className="u-badge">
              M C
            </div>
          </Tooltip>
        )}
      </div>
    );
  };

  const documentsTableColumns = [
    {
      title: t('common:title'),
      dataIndex: 'title',
      key: 'title',
      render: renderDocumentTitle
    },
    {
      title: t('common:language'),
      dataIndex: 'language',
      key: 'language',
      render: renderDocumentLanguage,
      responsive: ['sm'],
      width: '100px'
    },
    {
      title: t('initialAuthor'),
      dataIndex: 'user',
      key: 'user',
      render: renderDocumentCreatedBy,
      responsive: ['md'],
      width: '200px'
    },
    {
      title: t('badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderDocumentBadges,
      responsive: ['lg'],
      width: '50px'
    },
    {
      title: t('common:archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: renderDocumentArchived,
      responsive: ['lg'],
      needsPermission: permissions.MANAGE_ARCHIVED_DOCS,
      width: '100px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderDocumentActions,
      width: '100px'
    }
  ].filter(column => !column.needsPermission || hasUserPermission(user, column.needsPermission));

  const renderDocumentsTab = () => {
    return (
      <Fragment>
        <div className="RedactionPage-documentsControls">
          <FilterInput
            size="large"
            className="RedactionPage-documentsFilter"
            value={documentsFilterText}
            onChange={handleDocumentsSearchChange}
            placeholder={t('filterPlaceholder')}
            />
          <SortingSelector size="large" sorting={documentsSorting} options={documentsSortingOptions} onChange={handleDocumentsSortingChange} />
        </div>
        <DocumentsTable dataSource={[...displayedDocumentRows]} columns={documentsTableColumns} />
        <DocumentMetadataModal
          {...documentMetadataModalState}
          onSave={handleDocumentMetadataModalSave}
          onClose={handleDocumentMetadataModalClose}
          />
      </Fragment>
    );
  };

  const renderDocumentTagsTab = () => {
    return <DocumentTagsForceGraph docs={initialState.documents} />;
  };

  const tabItems = [
    {
      key: TABS.documents,
      label: t('documentsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          {renderDocumentsTab()}
        </div>
      )
    },
    {
      key: TABS.documentTags,
      label: t('documentTagsTabTitle'),
      children: (
        <div className="Tabs-tabPane">
          {renderDocumentTagsTab()}
        </div>
      )
    }
  ];

  return (
    <PageTemplate>
      <div className="RedactionPage">
        <h1>{t('pageNames:redaction')}</h1>
        <Tabs
          type="line"
          size="middle"
          className="Tabs"
          items={tabItems}
          activeKey={currentTab}
          destroyInactiveTabPane
          onChange={handleTabChange}
          />
      </div>
    </PageTemplate>
  );
}

Redaction.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired
  }).isRequired
};

export default Redaction;

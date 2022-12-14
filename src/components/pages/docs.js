import by from 'thenby';
import Table from '../table.js';
import PropTypes from 'prop-types';
import Restricted from '../restricted.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import SortingSelector from '../sorting-selector.js';
import { Input, Button, Switch, Tooltip } from 'antd';
import CloseIcon from '../icons/general/close-icon.js';
import DocumentInfoCell from '../document-info-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import LanguageIcon from '../localization/language-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { CheckOutlined, LikeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { DOCUMENT_ALLOWED_OPEN_CONTRIBUTION, DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import AllowedOpenContributionNoneIcon from '../icons/general/allowed-open-contribution-none-icon.js';
import AllowedOpenContributionContentIcon from '../icons/general/allowed-open-contribution-content-icon.js';
import AllowedOpenContributionMetadataAndContentIcon from '../icons/general/allowed-open-contribution-metadata-and-content-icon.js';

const { Search } = Input;
const logger = new Logger(import.meta.url);

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

function Docs({ initialState, PageTemplate }) {
  const user = useUser();
  const { t } = useTranslation('docs');
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);

  const mapToRows = useCallback(docs => docs.map(doc => (
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

  const [filterText, setFilterText] = useState('');
  const [displayedRows, setDisplayedRows] = useState([]);
  const [documents, setDocuments] = useState(initialState.documents);
  const [sorting, setSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));

  const sortingOptions = [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:language'), appliedLabel: t('common:sortedByLanguage'), value: 'language' },
    { label: t('common:user'), appliedLabel: t('common:sortedByUser'), value: 'user' }
  ];

  if (hasUserPermission(user, permissions.MANAGE_ARCHIVED_DOCS)) {
    sortingOptions.push({ label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' });
  }

  const sorters = useMemo(() => ({
    title: rowsToSort => rowsToSort.sort(by(row => row.title, { direction: sorting.direction, ignoreCase: true })),
    createdOn: rowsToSort => rowsToSort.sort(by(row => row.createdOn, sorting.direction)),
    updatedOn: rowsToSort => rowsToSort.sort(by(row => row.updatedOn, sorting.direction)),
    language: rowsToSort => rowsToSort.sort(by(row => row.language, sorting.direction)),
    user: rowsToSort => rowsToSort.sort(by(row => row.createdBy.displayName, { direction: sorting.direction, ignoreCase: true })),
    archived: rowsToSort => rowsToSort.sort(by(row => row.archived, sorting.direction))
  }), [sorting.direction]);

  useEffect(() => {
    const newRows = mapToRows(documents.slice());
    const sorter = sorters[sorting.value];

    const filteredRows = filterText
      ? newRows.filter(row => row.title.toLowerCase().includes(filterText.toLowerCase())
        || row.createdBy.displayName.toLowerCase().includes(filterText.toLowerCase()))
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
    setDocumentMetadataModalState(getDocumentMetadataModalState({ t, isOpen: true }));
  };

  const handleCloneClick = row => {
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

  const handleArchivedSwitchChange = async (archived, row) => {
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

  const renderLanguage = documentLanguage => <LanguageIcon language={documentLanguage} />;
  const renderTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return <DocumentInfoCell doc={doc} />;
  };

  const renderCreatedBy = (_user, row) => {
    return <a href={routes.getUserUrl(row.createdBy._id)}>{row.createdBy.displayName}</a>;
  };

  const renderActions = (_actions, row) => {
    return (
      <div className="DocsPage-actions">
        <ActionButtonGroup>
          <ActionButton
            title={t('common:clone')}
            icon={<DuplicateIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleCloneClick(row)}
            />
        </ActionButtonGroup>
      </div>
    );
  };

  const renderArchived = (archived, row) => {
    return (
      <Switch
        size="small"
        checked={row.archived}
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseIcon />}
        onChange={() => handleArchivedSwitchChange(archived, row)}
        />
    );
  };

  const renderBadges = (_, row) => {
    return (
      <div className="DocsPage-badges">
        {!!row.verified && (
          <Tooltip title={t('common:verifiedDocumentBadge')}>
            <LikeOutlined className="u-verified-badge" />
          </Tooltip>
        )}
        <Tooltip title={t(`common:allowedOpenContributionBadge_${row.allowedOpenContribution}`)}>
          <div className="u-allowed-open-contribution-badge">
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.none
              && <AllowedOpenContributionNoneIcon />}
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.content
              && <AllowedOpenContributionContentIcon />}
            {row.allowedOpenContribution === DOCUMENT_ALLOWED_OPEN_CONTRIBUTION.metadataAndContent
              && <AllowedOpenContributionMetadataAndContentIcon />}
          </div>
        </Tooltip>
      </div>
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
      title: t('badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderBadges,
      responsive: ['lg'],
      width: '50px'
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
          {...documentMetadataModalState}
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
    documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired
  }).isRequired
};

export default Docs;

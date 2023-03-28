import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
import { Button, Table, Tag, Tooltip } from 'antd';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceInfoCell from '../resource-info-cell.js';
import { replaceItem } from '../../utils/array-utils.js';
import React, { useEffect, useMemo, useState } from 'react';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { InboxOutlined, SafetyCertificateOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';

function getDocumentMetadataModalState({ t, mode = DOCUMENT_METADATA_MODAL_MODE.create, document = null, isOpen = false }) {
  let initialDocumentMetadata;
  switch (mode) {
    case DOCUMENT_METADATA_MODAL_MODE.create:
      initialDocumentMetadata = {};
      break;
    case DOCUMENT_METADATA_MODAL_MODE.update:
      initialDocumentMetadata = { ...document };
      break;
    case DOCUMENT_METADATA_MODAL_MODE.clone:
      initialDocumentMetadata = {
        ...document,
        title: `${document.title} ${t('common:copyTitleSuffix')}`,
        slug: document.slug ? `${document.slug}-${t('common:copySlugSuffix')}` : ''
      };
      break;
    default:
      throw new Error(`Invalid document metadata modal mode: '${mode}'`);
  }
  return {
    mode,
    allowMultiple: false,
    isOpen,
    documentToClone: document,
    initialDocumentMetadata
  };
}

function createTableRows(docs) {
  return docs.map(doc => ({
    key: doc._id,
    _id: doc._id,
    documentId: doc._id,
    title: doc.title,
    createdOn: doc.createdOn,
    updatedOn: doc.updatedOn,
    createdBy: doc.createdBy,
    user: doc.user,
    accreditedEditors: doc.publicContext.accreditedEditors,
    protected: doc.publicContext.protected,
    archived: doc.publicContext.archived,
    verified: doc.publicContext.verified,
    tags: doc.tags
  }));
}

function RedactionDocumentsTab({ documents, onDocumentsChange }) {
  const { formatDate } = useDateFormat();
  const [filterText, setFilterText] = useState('');
  const [allTableRows, setAllTableRows] = useState([]);
  const { t } = useTranslation('redactionDocumentsTab');
  const [currentPagination, setCurrentPagination] = useState(1);
  const [displayedTableRows, setDisplayedTableRows] = useState([]);
  const [currentTableSorting, setCurrentTableSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentPagination]);

  useEffect(() => {
    setAllTableRows(createTableRows(documents));
  }, [documents]);

  const documentsSortingOptions = useMemo(() => [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: 'title' },
    { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
    { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
    { label: t('common:creator'), appliedLabel: t('common:sortedByCreator'), value: 'creator' },
    { label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' },
    { label: t('common:protected'), appliedLabel: t('common:sortedByProtected'), value: 'protected' },
    { label: t('common:verified'), appliedLabel: t('common:sortedByVerified'), value: 'verified' }
  ], [t]);

  const tableSorters = useMemo(() => ({
    title: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.title, { direction, ignoreCase: true })),
    createdOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdOn, direction)),
    updatedOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.updatedOn, direction)),
    creator: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdBy.displayName, { direction, ignoreCase: true })),
    archived: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.archived, direction)),
    protected: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.protected, direction)),
    verified: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.verified, direction))
  }), []);

  useEffect(() => {
    const filter = filterText.toLowerCase();
    const filteredRows = filterText
      ? allTableRows.filter(row => row.title.toLowerCase().includes(filter) || row.createdBy.displayName.toLowerCase().includes(filter))
      : allTableRows;

    const sorter = tableSorters[currentTableSorting.value];
    const sortedRows = sorter ? sorter(filteredRows, currentTableSorting.direction) : filteredRows;

    setDisplayedTableRows(sortedRows);
  }, [allTableRows, filterText, currentTableSorting, tableSorters]);

  const handleTableChange = ({ current, pageSize }) => {
    setCurrentPagination([current, pageSize].join());
  };

  const handleCurrentTableSortingChange = ({ value, direction }) => {
    setCurrentTableSorting({ value, direction });
  };

  const handleFilterTextChange = event => {
    const newFilterText = event.target.value;
    setFilterText(newFilterText);
  };

  const handleDocumentEditClick = row => {
    const document = documents.find(d => d._id === row.documentId);
    setDocumentMetadataModalState(getDocumentMetadataModalState({
      t,
      mode: DOCUMENT_METADATA_MODAL_MODE.update,
      document,
      isOpen: true
    }));
  };

  const handleDocumentCloneClick = row => {
    const document = documents.find(d => d._id === row.documentId);
    setDocumentMetadataModalState(getDocumentMetadataModalState({
      t,
      mode: DOCUMENT_METADATA_MODAL_MODE.clone,
      document,
      isOpen: true
    }));
  };

  const handleCreateDocumentClick = () => {
    setDocumentMetadataModalState(getDocumentMetadataModalState({
      mode: DOCUMENT_METADATA_MODAL_MODE.create,
      isOpen: true
    }));
  };

  const handleDocumentMetadataModalSave = (savedDocuments, templateDocumentId) => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
    switch (documentMetadataModalState.mode) {
      case DOCUMENT_METADATA_MODAL_MODE.create:
      case DOCUMENT_METADATA_MODAL_MODE.clone:
        window.location = routes.getDocUrl({
          id: savedDocuments[0]._id,
          slug: savedDocuments[0].slug,
          view: DOC_VIEW_QUERY_PARAM.edit,
          templateDocumentId
        });
        break;
      case DOCUMENT_METADATA_MODAL_MODE.update:
        onDocumentsChange(savedDocuments.reduce((all, doc) => replaceItem(all, doc), documents));
        break;
      default:
        throw new Error(`Invalid document metadata modal mode: '${documentMetadataModalState.mode}'`);
    }
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const renderDocumentTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return (
      <ResourceInfoCell
        title={doc.title}
        description={doc.shortDescription}
        subtext={
          <div className="RedactionDocumentsTab-titleSubtext">
            <div>
              <span>{`${t('common:createdOnBy', { date: formatDate(doc.createdOn) })} `}</span>
              <a href={routes.getUserProfileUrl(doc.createdBy._id)}>{doc.createdBy.displayName}</a>
            </div>
            <div>
              <span>{`${t('common:updatedOnBy', { date: formatDate(doc.updatedOn) })} `}</span>
              <a href={routes.getUserProfileUrl(doc.updatedBy._id)}>{doc.updatedBy.displayName}</a>
            </div>
          </div>
        }
        url={routes.getDocUrl({ id: doc._id, slug: doc.slug })}
        />
    );
  };

  const renderCellTags = (_, row) => (
    <div>
      <ItemsExpander
        className="RedactionDocumentsTab-tags"
        expandLinkClassName="RedactionDocumentsTab-tagsExpandLink"
        items={row.tags}
        renderItem={tag => <Tag className="Tag" key={tag}>{tag}</Tag>}
        />
    </div>
  );

  const renderDocumentActions = (_actions, row) => {
    return (
      <div>
        <ActionButtonGroup>
          <ActionButton
            title={t('common:edit')}
            icon={<EditIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleDocumentEditClick(row)}
            />
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

  const renderDocumentBadges = (_, row) => {
    return (
      <div className="RedactionDocumentsTab-badges">
        {!!row.archived && (
          <Tooltip title={t('archivedDocumentBadge')}>
            <InboxOutlined className="u-large-badge" />
          </Tooltip>
        )}
        {!!row.verified && (
          <Tooltip title={t('common:verifiedDocumentBadge')}>
            <SafetyCertificateOutlined className="u-large-badge" />
          </Tooltip>
        )}
        {!!row.protected && (
          <Tooltip title={t('protectedDocumentBadge')}>
            <KeyOutlined className="u-large-badge" />
          </Tooltip>
        )}
        {!!row.accreditedEditors.length && (
          <Tooltip title={t('accreditedEditorsBadge')}>
            <TeamOutlined className="u-large-badge" />
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
      title: t('common:tags'),
      key: 'tags',
      render: renderCellTags,
      responsive: ['lg'],
      width: '300px'
    },
    {
      title: t('badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderDocumentBadges,
      responsive: ['md'],
      width: '140px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderDocumentActions,
      width: '100px'
    }
  ];

  return (
    <div className="RedactionDocumentsTab">
      <div className="RedactionDocumentsTab-controls">
        <FilterInput
          size="large"
          className="RedactionDocumentsTab-filter"
          value={filterText}
          onChange={handleFilterTextChange}
          placeholder={t('filterPlaceholder')}
          />
        <SortingSelector
          size="large"
          sorting={currentTableSorting}
          options={documentsSortingOptions}
          onChange={handleCurrentTableSortingChange}
          />
        <Button type="primary" onClick={handleCreateDocumentClick}>
          {t('common:create')}
        </Button>
      </div>
      <Table
        dataSource={[...displayedTableRows]}
        columns={documentsTableColumns}
        onChange={handleTableChange}
        />
      <DocumentMetadataModal
        {...documentMetadataModalState}
        onSave={handleDocumentMetadataModalSave}
        onClose={handleDocumentMetadataModalClose}
        />
    </div>
  );
}

RedactionDocumentsTab.propTypes = {
  documents: PropTypes.arrayOf(documentExtendedMetadataShape).isRequired,
  onDocumentsChange: PropTypes.func.isRequired
};

export default RedactionDocumentsTab;

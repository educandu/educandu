import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
import { Button, Table, Tag, Tooltip } from 'antd';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceInfoCell from '../resource-info-cell.js';
import { SORTING_DIRECTION, TABS } from './constants.js';
import { replaceItem } from '../../utils/array-utils.js';
import React, { useEffect, useMemo, useState } from 'react';
import DocumentIcon from '../icons/general/document-icon.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { documentExtendedMetadataShape } from '../../ui/default-prop-types.js';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { InboxOutlined, SafetyCertificateOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';

const SORTING_VALUE = {
  title: 'title',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn',
  creator: 'creator',
  archived: 'archived',
  protected: 'protected',
  verified: 'verified'
};

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
    allowedEditors: doc.publicContext.allowedEditors,
    protected: doc.publicContext.protected,
    archived: doc.publicContext.archived,
    verified: doc.publicContext.verified,
    tags: doc.tags
  }));
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TABS.documents ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);

  return {
    filter: (query.filter || '').trim(),
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.updatedOn,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

function RedactionDocumentsTab({ documents, onDocumentsChange }) {
  const request = useRequest();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('redactionDocumentsTab');

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      page: pagination.current,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getRedactionUrl(TABS.documents, queryParams));
  }, [filter, sorting, pagination]);

  useEffect(() => {
    setAllRows(createTableRows(documents));
  }, [documents]);

  const sortingOptions = useMemo(() => [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: SORTING_VALUE.title },
    { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
    { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn },
    { label: t('common:creator'), appliedLabel: t('common:sortedByCreator'), value: SORTING_VALUE.creator },
    { label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: SORTING_VALUE.archived },
    { label: t('common:protected'), appliedLabel: t('common:sortedByProtected'), value: SORTING_VALUE.protected },
    { label: t('common:verified'), appliedLabel: t('common:sortedByVerified'), value: SORTING_VALUE.verified }
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
    const lowerCasedFilter = filter.toLowerCase();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row => row.title.toLowerCase().includes(lowerCasedFilter)
          || row.createdBy.displayName.toLowerCase().includes(lowerCasedFilter))
      : allRows;

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter ? sorter(filteredRows, sorting.direction) : filteredRows;

    setDisplayedRows(sortedRows);
  }, [allRows, filter, sorting, tableSorters]);

  const handleTableChange = ({ current, pageSize }) => {
    setPagination({ page: current, pageSize });
  };

  const handleSortingChange = ({ value, direction }) => {
    setSorting({ value, direction });
  };

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
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

  const renderType = () => {
    return (
      <div className="u-cell-type-icon">
        <Tooltip title={t('common:searchResourceType_document')}>
          <DocumentIcon />
        </Tooltip>
      </div>
    );
  };

  const renderDocumentTitle = (_title, row) => {
    const doc = documents.find(d => d._id === row.documentId);
    if (!doc) {
      return null;
    }

    return (
      <ResourceInfoCell
        title={doc.title}
        shortDescription={doc.shortDescription}
        subtext={
          <div className="RedactionDocumentsTab-titleSubtext">
            <div>
              <span>{`${t('common:createdOnDateBy', { date: formatDate(doc.createdOn) })} `}</span>
              <a href={routes.getUserProfileUrl(doc.createdBy._id)}>{doc.createdBy.displayName}</a>
            </div>
            <div>
              <span>{`${t('common:updatedOnDateBy', { date: formatDate(doc.updatedOn) })} `}</span>
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
        {!!row.allowedEditors.length && (
          <Tooltip title={t('allowedEditorsBadge')}>
            <TeamOutlined className="u-large-badge" />
          </Tooltip>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: t('common:type'),
      key: 'type',
      render: renderType,
      width: '60px'
    },
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
          value={filter}
          onChange={handleFilterChange}
          placeholder={t('filterPlaceholder')}
          />
        <SortingSelector
          size="large"
          sorting={sorting}
          options={sortingOptions}
          onChange={handleSortingChange}
          />
        <Button type="primary" onClick={handleCreateDocumentClick}>
          {t('common:create')}
        </Button>
      </div>
      <Table
        className="u-table-with-pagination"
        dataSource={[...displayedRows]}
        columns={columns}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          showSizeChanger: true
        }}
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

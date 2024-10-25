import by from 'thenby';
import { Button, Table } from 'antd';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import TagsExpander from '../tags-expander.js';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { SORTING_DIRECTION, TAB } from './constants.js';
import { replaceItem } from '../../utils/array-utils.js';
import ResourceTitleCell from '../resource-title-cell.js';
import DocumentBadgesCell from '../document-bagdes-cell.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import DuplicateIcon from '../icons/general/duplicate-icon.js';
import { DOC_VIEW_QUERY_PARAM } from '../../domain/constants.js';
import DocumentMetadataModal from '../document-metadata-modal.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import DocumentApiClient from '../../api-clients/document-api-client.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DOCUMENT_METADATA_MODAL_MODE } from '../document-metadata-modal-utils.js';
import DocumentRatingApiClient from '../../api-clients/document-rating-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';

const SORTING_VALUE = {
  title: 'title',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn',
  creator: 'creator',
  archived: 'archived',
  protected: 'protected',
  verified: 'verified',
  ratingsCount: 'ratingsCount',
  averageRatingValue: 'averageRatingValue'
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

function createTableRows(documents, documentRatings) {
  const documentRatingsByDocumentId = new Map(documentRatings.map(r => [r.documentId, r]));
  return documents.map(doc => {
    const documentRating = documentRatingsByDocumentId.get(doc._id) || {
      _id: null,
      documentId: doc._id,
      ratingsCount: 0,
      ratingsCountPerValue: [0, 0, 0, 0, 0],
      averageRatingValue: null
    };
    return {
      key: doc._id,
      _id: doc._id,
      documentId: doc._id,
      title: doc.title,
      shortDescription: doc.shortDescription,
      slug: doc.slug,
      createdOn: doc.createdOn,
      createdBy: doc.createdBy,
      updatedOn: doc.updatedOn,
      updatedBy: doc.updatedBy,
      user: doc.user,
      contributors: doc.contributors,
      allowedEditors: doc.publicContext.allowedEditors,
      protected: doc.publicContext.protected,
      archived: doc.publicContext.archived,
      verified: doc.publicContext.verified,
      tags: doc.tags,
      rating: documentRating,
      ratingsCount: documentRating.ratingsCount,
      averageRatingValue: documentRating.averageRatingValue
    };
  });
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.documents ? request.query : {};

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

function ContentManagementDocumentsTab() {
  const request = useRequest();
  const [documents, setDocuments] = useState([]);
  const { t } = useTranslation('contentManagementDocumentsTab');
  const [documentRatings, setDocumentRatings] = useState([]);
  const documentApiClient = useSessionAwareApiClient(DocumentApiClient);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const documentRatingApiClient = useSessionAwareApiClient(DocumentRatingApiClient);
  const [documentMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({ t }));

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);

      const [documentApiResponse, documentRatingApiResponse] = await Promise.all([
        documentApiClient.getContentManagementDocuments(),
        documentRatingApiClient.getContentManagementDocumentRatings()
      ]);

      setDocuments(documentApiResponse.documents);
      setDocumentRatings(documentRatingApiResponse.documentRatings);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData, documentApiClient, documentRatingApiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(createTableRows(documents, documentRatings));
  }, [documents, documentRatings]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sorting: sorting.value,
      direction: sorting.direction
    };

    history.replaceState(null, '', routes.getContentManagementUrl(TAB.documents, queryParams));
  }, [filter, sorting, pagination]);

  const sortingOptions = useMemo(() => [
    { label: t('common:title'), appliedLabel: t('common:sortedByTitle'), value: SORTING_VALUE.title },
    { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
    { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn },
    { label: t('common:creator'), appliedLabel: t('common:sortedByCreator'), value: SORTING_VALUE.creator },
    { label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: SORTING_VALUE.archived },
    { label: t('common:protected'), appliedLabel: t('common:sortedByProtected'), value: SORTING_VALUE.protected },
    { label: t('common:verified'), appliedLabel: t('common:sortedByVerified'), value: SORTING_VALUE.verified },
    { label: t('common:ratingsCount'), appliedLabel: t('common:sortedByRatingsCount'), value: SORTING_VALUE.ratingsCount },
    { label: t('common:averageRatingValue'), appliedLabel: t('common:sortedByAverageRatingValue'), value: SORTING_VALUE.averageRatingValue }
  ], [t]);

  const tableSorters = useMemo(() => ({
    title: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.title, { direction, ignoreCase: true })),
    createdOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdOn, direction)),
    updatedOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.updatedOn, direction)),
    creator: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdBy.displayName, { direction, ignoreCase: true })),
    archived: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.archived, direction)),
    protected: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.protected, direction)),
    verified: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.verified, direction)),
    ratingsCount: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.ratingsCount, direction)),
    averageRatingValue: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.averageRatingValue, direction))
  }), []);

  useEffect(() => {
    const lowerCasedFilter = filter.toLowerCase();

    const filteredRows = lowerCasedFilter
      ? allRows.filter(row =>
        row.title.toLowerCase().includes(lowerCasedFilter)
        || row.contributors.some(contributor => contributor.displayName.toLowerCase().includes(lowerCasedFilter))
      )
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
        setDocuments(oldDocuments => {
          return savedDocuments.reduce((all, doc) => replaceItem(all, doc), oldDocuments);
        });
        break;
      default:
        throw new Error(`Invalid document metadata modal mode: '${documentMetadataModalState.mode}'`);
    }
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const renderDocumentTitle = (_, row) => {
    return (
      <ResourceTitleCell
        title={row.title}
        shortDescription={row.shortDescription}
        url={routes.getDocUrl({ id: row._id, slug: row.slug })}
        documentRating={row.rating}
        createdOn={row.createdOn}
        createdBy={row.createdBy}
        updatedOn={row.updatedOn}
        updatedBy={row.updatedBy}
        />
    );
  };

  const renderCellTags = (_, row) => (
    <TagsExpander tags={row.tags} />
  );

  const renderDocumentActions = (_actions, row) => {
    return (
      <div>
        <ActionButtonGroup>
          <ActionButton
            title={t('common:editMetadata')}
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
    return <DocumentBadgesCell publicContext={row} />;
  };

  const columns = [
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
      title: t('common:badges'),
      dataIndex: 'badges',
      key: 'badges',
      render: renderDocumentBadges,
      responsive: ['md'],
      width: '150px'
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
    <div className="ContentManagementDocumentsTab">
      <div className="ContentManagementDocumentsTab-controls">
        <FilterInput
          size="large"
          className="ContentManagementDocumentsTab-filter"
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
        dataSource={[...displayedRows]}
        columns={columns}
        className="u-table-with-pagination"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          showSizeChanger: true
        }}
        loading={fetchingData}
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

export default ContentManagementDocumentsTab;

import by from 'thenby';
import Spinner from '../spinner.js';
import { TAB } from './constants.js';
import Markdown from '../markdown.js';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import { CategoryIcon } from '../icons/icons.js';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Collapse, Tooltip } from 'antd';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import { useService } from '../container-context.js';
import { useDateFormat } from '../locale-context.js';
import DocumentSelector from '../document-selector.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import DocumentCategoryDisplay from '../document-category-display.js';
import { confirmDocumentCategoryDelete } from '../confirmation-dialogs.js';
import DocumentCategoryMetadataModal from './document-category-metadata-modal.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import DocumentCategoryApiClient from '../../api-clients/document-category-api-client.js';
import { ensureIsExcluded, ensureIsIncluded, replaceItem } from '../../utils/array-utils.js';

function getDefaultMetadataModalState() {
  return {
    isOpen: false,
    isEditing: false,
    initialDocumentCategory: {
      name: '',
      iconUrl: '',
      description: ''
    }
  };
}

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.documentCategories ? request.query : {};
  return { filter: (query.filter || '').trim() };
};

function MaintenanceDocumentCategoriesTab() {
  const request = useRequest();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('maintenanceDocumentCategoriesTab');
  const documentCategoryApiClient = useService(DocumentCategoryApiClient);

  const [allDocumentCategories, setAllDocumentCategories] = useState([]);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const [displayedDocumentCategories, setDisplayedDocumentCategories] = useState([]);
  const [metadataModalState, setMetadataModalState] = useState(getDefaultMetadataModalState());

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const documentCategoryApiResponse = await documentCategoryApiClient.getDocumentCategories();
      setAllDocumentCategories(documentCategoryApiResponse.documentCategories);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData, documentCategoryApiClient]);

  useEffect(() => {
    const queryParams = { filter };
    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.documentCategories, queryParams));
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const sanitizedFilter = filter.trim().toLowerCase();

    const filteredAndSortedCategories = allDocumentCategories
      .filter(documentCategory => !sanitizedFilter || documentCategory.name.toLowerCase().includes(sanitizedFilter))
      .sort(by(documentCategory => documentCategory.createdOn, 'desc'));

    setDisplayedDocumentCategories(filteredAndSortedCategories);
  }, [allDocumentCategories, filter]);

  const handleFilterChange = event => {
    const newFilter = event.target.value;
    setFilter(newFilter);
  };

  const handleCreateDocumentCategoryClick = () => {
    setMetadataModalState({ ...getDefaultMetadataModalState(), isOpen: true });
  };

  const handleMetadataModalSave = savedDocumentCategory => {
    const newDocumentCategories = metadataModalState.isEditing
      ? replaceItem(allDocumentCategories, savedDocumentCategory)
      : [...allDocumentCategories, savedDocumentCategory];

    setAllDocumentCategories(newDocumentCategories);
    setMetadataModalState({ ...getDefaultMetadataModalState() });
  };

  const handleMetadataModalClose = () => {
    setMetadataModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDocumentCategoryEditClick = (event, documentCategory) => {
    event.stopPropagation();
    setMetadataModalState(prev => ({
      ...prev,
      initialDocumentCategory: documentCategory,
      isEditing: true,
      isOpen: true
    }));
  };

  const handleDocumentCategoryDeleteClick = (event, documentCategory) => {
    event.stopPropagation();

    confirmDocumentCategoryDelete(t, documentCategory.name, async () => {
      await documentCategoryApiClient.deleteDocumentCategory({ documentCategoryId: documentCategory._id });
      const newDocumentCategories = ensureIsExcluded(allDocumentCategories, documentCategory);
      setAllDocumentCategories(newDocumentCategories);
    });
  };

  const handleDocumentSelectorButtonClick = async (documentCategory, documentId) => {
    const apiResponse = await documentCategoryApiClient.updateDocumentCategoryDocuments({
      documentCategoryId: documentCategory._id,
      documentIds: ensureIsIncluded([...documentCategory.documentIds], documentId)
    });

    const newDocumentCategories = replaceItem(allDocumentCategories, apiResponse.documentCategory);
    setAllDocumentCategories(newDocumentCategories);
  };

  const handleRemoveDocumentClick = async (documentCategory, documentId) => {
    const apiResponse = await documentCategoryApiClient.updateDocumentCategoryDocuments({
      documentCategoryId: documentCategory._id,
      documentIds: ensureIsExcluded([...documentCategory.documentIds], documentId)
    });

    const newDocumentCategories = replaceItem(allDocumentCategories, apiResponse.documentCategory);
    setAllDocumentCategories(newDocumentCategories);
  };

  const renderDocument = (documentCategory, doc) => {
    const url = routes.getDocUrl({ id: doc._id, slug: doc.slug });
    return (
      <div key={doc._id} className="MaintenanceDocumentCategoriesTab-categoryDocument">
        <div key={doc._id} className="MaintenanceDocumentCategoriesTab-categoryDocumentTitle">
          <a href={url}>{doc.title}</a>
        </div>
        <Tooltip title={t('removeDocumentTooltip', { name: documentCategory.name })}>
          <Button
            type='text'
            size="small"
            icon={<DeleteIcon />}
            className='u-action-button u-danger-action-button'
            onClick={() => handleRemoveDocumentClick(documentCategory, doc._id)}
            />
        </Tooltip>
      </div>
    );
  };

  const renderDocuments = documentCategory => {
    return (
      <div>
        {documentCategory.documents.map(doc => renderDocument(documentCategory, doc))}
        <div className="MaintenanceDocumentCategoriesTab-categoryDocumentSelector">
          <DocumentSelector
            useSelectButton
            selectButtonText={t('common:addDocument')}
            onSelectButtonClick={documentId => handleDocumentSelectorButtonClick(documentCategory, documentId)}
            />
        </div>
      </div>
    );
  };

  const renderDocumentCategory = documentCategory => {
    const label = (
      <DocumentCategoryDisplay documentCategory={documentCategory} />
    );

    const extra = (
      <div className="MaintenanceDocumentCategoriesTab-categoryPanelButtonsGroup">
        <Button
          icon={<EditIcon />}
          title={t('common:edit')}
          onClick={event => handleDocumentCategoryEditClick(event, documentCategory)}
          />
        <Button
          danger
          icon={<DeleteIcon />}
          title={t('common:delete')}
          onClick={event => handleDocumentCategoryDeleteClick(event, documentCategory)}
          />
      </div>
    );

    return (
      <Collapse
        key={documentCategory._id}
        className="MaintenanceDocumentCategoriesTab-categoryCollapse"
        items={[{
          label,
          extra,
          key: documentCategory._id,
          className: 'MaintenanceDocumentCategoriesTab-categoryPanel',
          children: (
            <div className="MaintenanceDocumentCategoriesTab-categoryDetails">
              {!!documentCategory.description && (
              <div className="MaintenanceDocumentCategoriesTab-categoryDescription">
                <Markdown>
                  {documentCategory.description}
                </Markdown>
              </div>
              )}

              <div className="MaintenanceDocumentCategoriesTab-categoryDetailsHeader">
                {t('common:documentCategoryDocumentListHeader')}
              </div>
              {renderDocuments(documentCategory)}

              <div className="MaintenanceDocumentCategoriesTab-categoryDetailsFooter">
                <div>
                  <div>
                    <span>{`${t('common:createdOnDateBy', { date: formatDate(documentCategory.createdOn) })} `}</span>
                    <a href={routes.getUserProfileUrl(documentCategory.createdBy._id)}>{documentCategory.createdBy.displayName}</a>
                  </div>
                  <div>
                    <span>{`${t('common:updatedOnDateBy', { date: formatDate(documentCategory.updatedOn) })} `}</span>
                    <a href={routes.getUserProfileUrl(documentCategory.updatedBy._id)}>{documentCategory.updatedBy.displayName}</a>
                  </div>
                </div>
                <DocumentCategoryDisplay bordered asLink documentCategory={documentCategory} />
              </div>
            </div>
          )
        }]}
        />
    );
  };

  const showEmptyState = !allDocumentCategories.length;

  return (
    <div className="MaintenanceDocumentCategoriesTab">
      {!!fetchingData && <Spinner /> }

      {!fetchingData && !!showEmptyState && (
        <EmptyState
          icon={<CategoryIcon />}
          title={t('emptyStateTitle')}
          subtitle={t('emptyStateSubtitle')}
          button={{
            icon: <PlusOutlined />,
            text: t('emptyStateButton'),
            onClick: handleCreateDocumentCategoryClick
          }}
          />
      )}

      {!fetchingData && !showEmptyState && (
        <Fragment>
          <div className="MaintenanceDocumentCategoriesTab-controls">
            <FilterInput
              size="large"
              className="MaintenanceDocumentCategoriesTab-filter"
              value={filter}
              onChange={handleFilterChange}
              placeholder={t('filterPlaceholder')}
              />
            <div />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDocumentCategoryClick}>
              {t('common:create')}
            </Button>
          </div>
          <div className="MaintenanceDocumentCategoriesTab-categories">
            {displayedDocumentCategories.map(renderDocumentCategory)}
          </div>
        </Fragment>
      )}

      <DocumentCategoryMetadataModal
        {...metadataModalState}
        onSave={handleMetadataModalSave}
        onClose={handleMetadataModalClose}
        />
    </div>
  );
}

export default MaintenanceDocumentCategoriesTab;

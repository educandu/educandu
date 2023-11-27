import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { Button, message, Table } from 'antd';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import ResourceTypeCell from '../resource-type-cell.js';
import { SORTING_DIRECTION, TAB } from './constants.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import ResourceTitleCell from '../resource-title-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import { getResourceTypeTranslation } from '../../utils/resource-utils.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { ensureIsExcluded, ensureIsIncluded, replaceItem } from '../../utils/array-utils.js';
import MediaLibaryItemModal, { MEDIA_LIBRARY_ITEM_MODAL_MODE } from '../resource-selector/media-library/media-library-item-modal.js';

const logger = new Logger(import.meta.url);

const SORTING_VALUE = {
  name: 'name',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn',
  user: 'user',
  size: 'size',
  type: 'type'
};

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.mediaLibrary ? request.query : {};

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

function getMediaLibraryItemModalState({ mode = MEDIA_LIBRARY_ITEM_MODAL_MODE.create, mediaLibraryItem = null, isOpen = false }) {
  return { mode, isOpen, mediaLibraryItem };
}

function createTableRows(mediaLibraryItems, t) {
  return mediaLibraryItems.map(item => ({
    ...item,
    key: item._id,
    translatedResourceType: getResourceTypeTranslation({ resourceType: item.resourceType, t })
  }));
}

function filterRow(row, lowerCasedFilter) {
  return row.name.toLowerCase().includes(lowerCasedFilter)
    || row.tags.some(tag => tag.toLowerCase().includes(lowerCasedFilter))
    || row.licenses.some(license => license.toLowerCase().includes(lowerCasedFilter))
    || row.createdBy.displayName.toLowerCase().includes(lowerCasedFilter)
    || row.updatedBy.displayName.toLowerCase().includes(lowerCasedFilter);
}

function filterRows(rows, filter) {
  const lowerCasedFilter = filter.toLowerCase().trim();
  return lowerCasedFilter ? rows.filter(row => filterRow(row, lowerCasedFilter)) : rows;
}

function MaintenanceMediaLibraryTab({ mediaLibraryItems, onMediaLibraryItemsChange }) {
  const request = useRequest();
  const { t } = useTranslation('maintenanceMediaLibraryTab');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const requestQuery = getSanitizedQueryFromRequest(request);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [mediaLibraryItemModalState, setMediaLibraryItemModalState] = useState(getMediaLibraryItemModalState({}));

  const [renderingRows, setRenderingRows] = useState(true);

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

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.mediaLibrary, queryParams));
  }, [filter, sorting, pagination]);

  useEffect(() => {
    setAllRows(createTableRows(mediaLibraryItems, t));
  }, [mediaLibraryItems, t]);

  const sortingOptions = useMemo(() => {
    const options = [
      { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: SORTING_VALUE.name },
      { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
      { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn },
      { label: t('common:user'), appliedLabel: t('common:sortedByCreator'), value: SORTING_VALUE.user },
      { label: t('common:size'), appliedLabel: t('common:sortedBySize'), value: SORTING_VALUE.size },
      { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: SORTING_VALUE.type }
    ];

    return options;
  }, [t]);

  const tableSorters = useMemo(() => ({
    name: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.name, { direction, ignoreCase: true })),
    createdOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdOn, direction)),
    updatedOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.updatedOn, direction)),
    user: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdBy.displayName, { direction, ignoreCase: true })),
    size: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.size, direction)),
    type: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.translatedResourceType, { direction, ignoreCase: true }))
  }), []);

  useEffect(() => {
    const filteredRows = filterRows(allRows, filter);
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

  const handlePreviewItemClick = row => {
    event.preventDefault();
    event.stopPropagation();
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setMediaLibraryItemModalState(getMediaLibraryItemModalState({ mode: MEDIA_LIBRARY_ITEM_MODAL_MODE.preview, mediaLibraryItem, isOpen: true }));
  };

  const handleCreateItemClick = () => {
    setMediaLibraryItemModalState(getMediaLibraryItemModalState({ mode: MEDIA_LIBRARY_ITEM_MODAL_MODE.create, mediaLibraryItem: null, isOpen: true }));
  };

  const handleEditItemClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setMediaLibraryItemModalState(getMediaLibraryItemModalState({ mode: MEDIA_LIBRARY_ITEM_MODAL_MODE.update, mediaLibraryItem, isOpen: true }));
  };

  const handleDeleteItemClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    confirmMediaFileHardDelete(t, mediaLibraryItem.name, async () => {
      try {
        await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: mediaLibraryItem._id });
        onMediaLibraryItemsChange(oldItems => ensureIsExcluded(oldItems, mediaLibraryItem));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleMediaLibraryItemModalSave = savedItem => {
    const isNewItem = mediaLibraryItemModalState.mode === MEDIA_LIBRARY_ITEM_MODAL_MODE.create;
    setMediaLibraryItemModalState(previousState => ({ ...previousState, isOpen: false }));
    onMediaLibraryItemsChange(oldItems => isNewItem ? ensureIsIncluded(oldItems, savedItem) : replaceItem(oldItems, savedItem));
  };

  const handleMediaLibraryItemModalClose = () => {
    setMediaLibraryItemModalState(previousState => ({ ...previousState, isOpen: false }));
  };

  const handleRowRendered = (record, rowIndex) => {
    const indexOfLastRecordOnPage = Math.min(displayedRows.length - 1, pagination.pageSize - 1);

    if (rowIndex === indexOfLastRecordOnPage) {
      const delayToAvoidRerenderingClash = 100;
      setTimeout(() => setRenderingRows(false), delayToAvoidRerenderingClash);
    }
    return {};
  };

  const renderType = (_, row) => (
    <ResourceTypeCell searchResourceType={row.resourceType} />
  );

  const renderName = (_, row) => {
    return (
      <ResourceTitleCell
        title={row.name}
        shortDescription={row.shortDescription}
        url={routes.getMediaLibraryItemUrl(row._id)}
        createdOn={row.createdOn}
        createdBy={row.createdBy}
        updatedOn={row.updatedOn}
        updatedBy={row.updatedBy}
        />
    );
  };

  const renderTagsOrLicenses = tagsOrLicenses => (
    <TagsExpander tags={tagsOrLicenses} />
  );

  const renderActions = (_actions, row) => {
    return (
      <div>
        <ActionButtonGroup>
          <ActionButton
            title={t('common:preview')}
            icon={<PreviewIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handlePreviewItemClick(row)}
            />
          <ActionButton
            title={t('common:edit')}
            icon={<EditIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handleEditItemClick(row)}
            />
          <ActionButton
            title={t('common:delete')}
            icon={<DeleteIcon />}
            intent={ACTION_BUTTON_INTENT.error}
            onClick={() => handleDeleteItemClick(row)}
            />
        </ActionButtonGroup>
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
      title: t('common:name'),
      dataIndex: 'name',
      key: 'name',
      render: renderName
    },
    {
      title: t('common:tags'),
      dataIndex: 'tags',
      key: 'tags',
      render: renderTagsOrLicenses,
      responsive: ['lg'],
      width: '300px'
    },
    {
      title: t('common:licenses'),
      dataIndex: 'licenses',
      key: 'licenses',
      render: renderTagsOrLicenses,
      responsive: ['md'],
      width: '150px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions,
      width: '100px'
    }
  ];

  return (
    <div className="MaintenanceMediaLibraryTab">
      <div className="MaintenanceMediaLibraryTab-controls">
        <FilterInput
          size="large"
          className="MaintenanceMediaLibraryTab-filter"
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
        <Button type="primary" onClick={handleCreateItemClick}>
          {t('common:create')}
        </Button>
      </div>
      <Table
        dataSource={[...displayedRows]}
        columns={columns}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          showSizeChanger: true
        }}
        loading={renderingRows}
        onRow={handleRowRendered}
        onChange={handleTableChange}
        />
      <MediaLibaryItemModal
        {...mediaLibraryItemModalState}
        onSave={handleMediaLibraryItemModalSave}
        onClose={handleMediaLibraryItemModalClose}
        />
    </div>
  );
}

MaintenanceMediaLibraryTab.propTypes = {
  mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired,
  onMediaLibraryItemsChange: PropTypes.func.isRequired
};

export default MaintenanceMediaLibraryTab;

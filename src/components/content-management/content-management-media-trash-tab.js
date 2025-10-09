import by from 'thenby';
import { TAB } from './constants.js';
import { message, Table } from 'antd';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import SortingSelector from '../sorting-selector.js';
import ResourceTypeCell from '../resource-type-cell.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import ResourceTitleCell from '../resource-title-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getResourceTypeTranslation } from '../../utils/resource-utils.js';
import { ensureIsExcluded, replaceItem } from '../../utils/array-utils.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import MediaLibaryItemsModal, { MEDIA_LIBRARY_ITEMS_MODAL_MODE } from '../resource-selector/media-library/media-library-items-modal.js';

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
  const query = request.query.tab === TAB.mediaTrash ? request.query : {};

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

function createTableRows(mediaTrashItems, t) {
  return mediaTrashItems.map(item => ({
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

function getMediaLibraryItemsModalDefaultState() {
  return {
    mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.none,
    mediaLibraryItem: null,
    isOpen: false
  };
}

function ContentManagementMediaTrashTab() {
  const user = useUser();
  const request = useRequest();
  const [mediaTrashItems, setMediaTrashItems] = useState([]);
  const { t } = useTranslation('contentManagementMediaTrashTab');
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [mediaLibraryItemsModalState, setMediaLibraryItemsModalState] = useState(getMediaLibraryItemsModalDefaultState());

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [filter, setFilter] = useState(requestQuery.filter);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const apiClientResponse = await mediaLibraryApiClient.getContentManagementMediaLibraryItems();
      setMediaTrashItems(apiClientResponse.mediaLibraryItems);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData, mediaLibraryApiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(createTableRows(mediaTrashItems, t));
  }, [mediaTrashItems, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      sorting: sorting.value,
      direction: sorting.direction,
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    history.replaceState(null, '', routes.getContentManagementUrl(TAB.mediaTrash, queryParams));
  }, [filter, sorting, pagination]);

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
    const sorter = tableSorters[sorting.value];

    const filteredRows = filterRows(allRows, filter);
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
    const mediaLibraryItem = mediaTrashItems.find(item => item._id === row.key);
    setMediaLibraryItemsModalState({ mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview, mediaLibraryItem, isOpen: true });
  };

  const handleDeleteItemClick = row => {
    const mediaLibraryItem = mediaTrashItems.find(item => item._id === row.key);
    confirmMediaFileHardDelete(t, mediaLibraryItem.name, async () => {
      try {
        await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: mediaLibraryItem._id });
        setMediaTrashItems(oldItems => ensureIsExcluded(oldItems, mediaLibraryItem));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleMediaLibraryItemsModalCreated = createdItems => {
    setMediaTrashItems(oldItems => [...oldItems, ...createdItems]);
  };

  const handleMediaLibraryItemsModalUpdated = savedItem => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
    setMediaTrashItems(oldItems => replaceItem(oldItems, savedItem));
  };

  const handleMediaLibraryItemsModalClose = () => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
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

  const renderTags = tagsOrLicenses => (
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
          {/* {hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT) && (
            <ActionButton
              title={t('common:delete')}
              icon={<DeleteIcon />}
              intent={ACTION_BUTTON_INTENT.success}
              onClick={() => handleDeleteItemClick(row)}
              />
          )} */}
          {hasUserPermission(user, permissions.DELETE_PUBLIC_CONTENT) && (
            <ActionButton
              title={t('common:delete')}
              icon={<DeleteIcon />}
              intent={ACTION_BUTTON_INTENT.error}
              onClick={() => handleDeleteItemClick(row)}
              />
          )}
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
      render: renderTags,
      responsive: ['lg'],
      width: '300px'
    },
    {
      title: t('common:licenses'),
      dataIndex: 'licenses',
      key: 'licenses',
      render: () => 'TODO',
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
    <div className="ContentManagementMediaTrashTab">
      <div className="ContentManagementMediaTrashTab-filterControls">
        <FilterInput
          size="large"
          className="ContentManagementMediaTrashTab-filter"
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
      <MediaLibaryItemsModal
        {...mediaLibraryItemsModalState}
        onCreated={handleMediaLibraryItemsModalCreated}
        onUpdated={handleMediaLibraryItemsModalUpdated}
        onClose={handleMediaLibraryItemsModalClose}
        />
    </div>
  );
}

export default ContentManagementMediaTrashTab;

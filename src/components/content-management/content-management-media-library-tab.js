import by from 'thenby';
import dayjs from 'dayjs';
import Info from '../info.js';
import { TAB } from './constants.js';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import { InfoIcon } from '../icons/icons.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceTypeCell from '../resource-type-cell.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import ResourceTitleCell from '../resource-title-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import { useDebouncedFetchingState } from '../../ui/hooks.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getResourceTypeTranslation } from '../../utils/resource-utils.js';
import { Button, Collapse, message, Table, Radio, DatePicker } from 'antd';
import MediaLibraryItemUsageModal from './media-library-item-usage-modal.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import { RESOURCE_USAGE, SORTING_DIRECTION } from '../../domain/constants.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { ensureAreExcluded, ensureIsExcluded, replaceItem } from '../../utils/array-utils.js';
import { confirmBulkDeleteMediaItems, confirmMediaFileSoftDelete } from '../confirmation-dialogs.js';
import MediaLibaryItemsModal, { MEDIA_LIBRARY_ITEMS_MODAL_MODE } from '../resource-selector/media-library/media-library-items-modal.js';

const logger = new Logger(import.meta.url);

const SORTING_VALUE = {
  name: 'name',
  createdOn: 'createdOn',
  updatedOn: 'updatedOn',
  creator: 'creator',
  size: 'size',
  type: 'type'
};

const DEFAULT_USAGE = RESOURCE_USAGE.unused;

const getSanitizedQueryFromRequest = request => {
  const query = request.query.tab === TAB.mediaLibrary ? request.query : {};

  const pageNumber = Number(query.page);
  const pageSizeNumber = Number(query.pageSize);
  const createdBeforeMilliseconds = parseInt((query.createdBefore || '').trim(), 10);
  const createdBefore = !isNaN(createdBeforeMilliseconds) ? new Date(createdBeforeMilliseconds) : null;
  const isValidUsage = query.usage === RESOURCE_USAGE.unused || query.usage === RESOURCE_USAGE.deprecated;

  return {
    filter: (query.filter || '').trim(),
    sorting: Object.values(SORTING_VALUE).includes(query.sorting) ? query.sorting : SORTING_VALUE.updatedOn,
    direction: Object.values(SORTING_DIRECTION).includes(query.direction) ? query.direction : SORTING_DIRECTION.desc,
    createdBefore,
    usage: createdBefore && isValidUsage ? query.usage : DEFAULT_USAGE,
    page: !isNaN(pageNumber) ? pageNumber : 1,
    pageSize: !isNaN(pageSizeNumber) ? pageSizeNumber : 10
  };
};

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

function getMediaLibraryItemsModalDefaultState() {
  return {
    mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.none,
    mediaLibraryItem: null,
    isOpen: false
  };
}

function getMediaLibraryItemUsageModalDefaultState() {
  return {
    mediaLibraryItemName: null,
    isOpen: false
  };
}

function ContentManagementMediaLibraryTab() {
  const user = useUser();
  const request = useRequest();
  const { dateFormat } = useDateFormat();
  const { t } = useTranslation('contentManagementMediaLibraryTab');
  const [mediaLibraryItems, setMediaLibraryItems] = useState([]);
  const [fetchingData, setFetchingData] = useDebouncedFetchingState(true);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [mediaLibraryItemsModalState, setMediaLibraryItemsModalState] = useState(getMediaLibraryItemsModalDefaultState());
  const [mediaLibraryItemUsageModalState, setMediaLibraryItemUsageModalState] = useState(getMediaLibraryItemUsageModalDefaultState());

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [usage, setUsage] = useState(requestQuery.usage);
  const [filter, setFilter] = useState(requestQuery.filter);
  const [createdBefore, setCreatedBefore] = useState(requestQuery.createdBefore);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const apiClientResponse = await mediaLibraryApiClient.getContentManagementMediaLibraryItems();
      setMediaLibraryItems(apiClientResponse.mediaLibraryItems);
    } finally {
      setFetchingData(false);
    }
  }, [setFetchingData, mediaLibraryApiClient]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setAllRows(createTableRows(mediaLibraryItems, t));
  }, [mediaLibraryItems, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pagination]);

  useEffect(() => {
    const queryParams = {
      filter,
      sorting: sorting.value,
      direction: sorting.direction,
      createdBefore: createdBefore?.getTime(),
      usage: createdBefore ? usage : null,
      page: pagination.page,
      pageSize: pagination.pageSize
    };

    history.replaceState(null, '', routes.getContentManagementUrl(TAB.mediaLibrary, queryParams));
  }, [filter, sorting, createdBefore, usage, pagination]);

  const sortingOptions = useMemo(() => {
    const options = [
      { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: SORTING_VALUE.name },
      { label: t('common:creationDate'), appliedLabel: t('common:sortedByCreatedOn'), value: SORTING_VALUE.createdOn },
      { label: t('common:updateDate'), appliedLabel: t('common:sortedByUpdatedOn'), value: SORTING_VALUE.updatedOn },
      { label: t('common:creator'), appliedLabel: t('common:sortedByCreator'), value: SORTING_VALUE.creator },
      { label: t('common:size'), appliedLabel: t('common:sortedBySize'), value: SORTING_VALUE.size },
      { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: SORTING_VALUE.type }
    ];

    return options;
  }, [t]);

  const tableSorters = useMemo(() => ({
    name: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.name, { direction, ignoreCase: true })),
    createdOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdOn, direction)),
    updatedOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.updatedOn, direction)),
    creator: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdBy.displayName, { direction, ignoreCase: true })),
    size: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.size, direction)),
    type: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.translatedResourceType, { direction, ignoreCase: true }))
  }), []);

  useEffect(() => {
    let filteredRows = filterRows(allRows, filter);

    if (createdBefore) {
      filteredRows = filteredRows
        .filter(row => row.usage === usage && new Date(row.createdOn) < createdBefore);
    }

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter ? sorter(filteredRows, sorting.direction) : filteredRows;

    setDisplayedRows(sortedRows);

  }, [allRows, filter, sorting, tableSorters, createdBefore, usage]);

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

  const handleCreatedBeforeFilterChange = dayjsValue => {
    setCreatedBefore(dayjsValue?.startOf('date').toDate() || null);
  };

  const handleUsageChange = event => {
    setUsage(event.target.value);
  };

  const handleViewItemUsageClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setMediaLibraryItemUsageModalState({ mediaLibraryItemName: mediaLibraryItem.name, isOpen: true });
  };

  const handlePreviewItemClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setMediaLibraryItemsModalState({ mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview, mediaLibraryItem, isOpen: true });
  };

  const handleCreateItemsClick = () => {
    setMediaLibraryItemsModalState({ mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.create, mediaLibraryItem: null, isOpen: true });
  };

  const handleEditItemClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setMediaLibraryItemsModalState({ mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.update, mediaLibraryItem, isOpen: true });
  };

  const handleDeleteItemClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    confirmMediaFileSoftDelete(t, mediaLibraryItem.name, async () => {
      try {
        await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: mediaLibraryItem._id });
        setMediaLibraryItems(oldItems => ensureIsExcluded(oldItems, mediaLibraryItem));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleMediaLibraryItemsModalCreated = createdItems => {
    setMediaLibraryItems(oldItems => [...oldItems, ...createdItems]);
  };

  const handleMediaLibraryItemsModalUpdated = savedItem => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
    setMediaLibraryItems(oldItems => replaceItem(oldItems, savedItem));
  };

  const handleMediaLibraryItemsModalClose = () => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
  };

  const handleMediaLibraryItemUsageModalClose = () => {
    setMediaLibraryItemUsageModalState(getMediaLibraryItemUsageModalDefaultState());
  };

  const determineDisabledDate = dayjsValue => {
    return dayjsValue.isAfter(new Date());
  };

  const handleBulkDeleteClick = () => {
    if (createdBefore && usage) {
      confirmBulkDeleteMediaItems(t, displayedRows.length, async () => {
        const mediaLibraryItemIds = displayedRows.map(row => row._id);
        try {
          await mediaLibraryApiClient.bulkDeleteMediaLibraryItems({ mediaLibraryItemIds });
          const deletedMediaLibraryItems = mediaLibraryItems.filter(item => mediaLibraryItemIds.includes(item._id));
          setMediaLibraryItems(oldItems => ensureAreExcluded(oldItems, deletedMediaLibraryItems));
          message.success(t('common:changesSavedSuccessfully'));
        } catch (error) {
          handleApiError({ error, logger, t });
        }
      });
    }
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
            title={t('common:usageOverview')}
            icon={<InfoIcon />}
            intent={ACTION_BUTTON_INTENT.info}
            onClick={() => handleViewItemUsageClick(row)}
            />
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
      width: '148px'
    },
    {
      title: t('common:actions'),
      dataIndex: 'actions',
      key: 'actions',
      render: renderActions,
      width: '148px'
    }
  ];

  const isBulkDeleteDisabled = !createdBefore || !displayedRows.length;

  return (
    <div className="ContentManagementMediaLibraryTab">
      <div className="ContentManagementMediaLibraryTab-filterControls">
        <FilterInput
          size="large"
          className="ContentManagementMediaLibraryTab-filter"
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
        <Button type="primary" onClick={handleCreateItemsClick}>
          {t('common:create')}
        </Button>
      </div>
      <div className="ContentManagementMediaLibraryTab-bulkDeletePanel">
        <Collapse
          size="small"
          expandIconPosition="end"
          defaultActiveKey={createdBefore ? ['bulkDelete'] : []}
          items={[{
            key: 'bulkDelete',
            label: (
              <div className="ContentManagementMediaLibraryTab-bulkDeletePanelHeader">
                {t('bulkDeletePanelHeader')}
              </div>
            ),
            children: (
              <div className="ContentManagementMediaLibraryTab-bulkDeletePanelContent">
                <div className="ContentManagementMediaLibraryTab-bulkDeletePanelFilters">
                  <div>{t('createdBefore')}</div>
                  <DatePicker
                    showTime={false}
                    format={dateFormat}
                    placeholder={t('common:date')}
                    disabledDate={determineDisabledDate}
                    value={createdBefore ? dayjs(createdBefore) : null}
                    onChange={handleCreatedBeforeFilterChange}
                    />
                  <div>{t('and')}</div>
                  <Info
                    iconAfterContent
                    tooltip={<Markdown>{t('usageInfoMarkdown')}</Markdown>}
                    className="ContentManagementMediaLibraryTab-bulkDeletePanelRadios"
                    >
                    <Radio.Group value={usage} disabled={!createdBefore} onChange={handleUsageChange}>
                      <Radio.Button value={RESOURCE_USAGE.unused}>{t('common:neverUsed')}</Radio.Button>
                      <Radio.Button value={RESOURCE_USAGE.deprecated}>{t('common:noLongerUsed')}</Radio.Button>
                    </Radio.Group>
                  </Info>
                </div>
                <div className="ContentManagementMediaLibraryTab-bulkDeletePanelButton">
                  <Button disabled={isBulkDeleteDisabled} danger type="primary" onClick={handleBulkDeleteClick}>
                    {!!isBulkDeleteDisabled && t('delete')}
                    {!isBulkDeleteDisabled && t('deleteCount', { count: displayedRows.length })}
                  </Button>
                </div>
              </div>
            )
          }]}
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
      <MediaLibraryItemUsageModal
        {...mediaLibraryItemUsageModalState}
        onClose={handleMediaLibraryItemUsageModalClose}
        />
    </div>
  );
}

export default ContentManagementMediaLibraryTab;

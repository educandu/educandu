import by from 'thenby';
import memoizee from 'memoizee';
import PropTypes from 'prop-types';
import { TAB } from './constants.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import EditIcon from '../icons/general/edit-icon.js';
import { usePaging } from '../../ui/paging-hooks.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceTypeIcon from '../resource-type-icon.js';
import MediaUsageSelect from '../media-usage-select.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { InfoIcon, RestoreIcon } from '../icons/icons.js';
import { Button, message, Table, DatePicker } from 'antd';
import PreviewIcon from '../icons/general/preview-icon.js';
import { SORTING_DIRECTION } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { usageFilterValueToRegExp } from '../../utils/media-usage-utils.js';
import MediaLibraryItemUsageModal from './media-library-item-usage-modal.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import MediaTrashApiClient from '../../api-clients/media-trash-api-client.js';
import LicenseSelect, { ALL_RIGHTS_RESERVED_KEY } from '../license-select.js';
import { useDebouncedFetchingState, useInitialQuery } from '../../ui/hooks.js';
import { ensureAreExcluded, ensureIsExcluded } from '../../utils/array-utils.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { createSorter, useSorting, useSortingConfiguration } from '../../ui/sorting-hooks.js';
import { createDateFilter, createTextFilter, useFiltering, useFilteringConfiguration } from '../../ui/filtering-hooks.js';
import { confirmMediaFileHardDelete, confirmMediaFileRestore, confirmMediaFileSoftDelete } from '../confirmation-dialogs.js';
import MediaLibaryItemsModal, { MEDIA_LIBRARY_ITEMS_MODAL_MODE } from '../resource-selector/media-library/media-library-items-modal.js';

const { RangePicker } = DatePicker;

const logger = new Logger(import.meta.url);

const usageFilterValueToRegExpMemoized = memoizee(usageFilterValueToRegExp, { max: 1 });

// Common filters:
const textFilter = createTextFilter('text', (item, filterValue) => {
  return item.mediaLibraryItem.name.toLowerCase().includes(filterValue)
    || item.mediaLibraryItem.tags.some(tag => tag.toLowerCase().includes(filterValue))
    || item.mediaLibraryItem.licenses.some(license => license.toLowerCase().includes(filterValue))
    || item.mediaLibraryItem.createdBy.displayName.toLowerCase().includes(filterValue)
    || item.mediaLibraryItem.updatedBy.displayName.toLowerCase().includes(filterValue)
    || (item.mediaTrashItem && item.mediaTrashItem.createdBy.displayName.toLowerCase().includes(filterValue));
}, { prepareFilterValue: filterValue => filterValue.toLowerCase(), skipFilterIf: filterValue => !filterValue });
const licenseFilter = createTextFilter('license', (item, filterValue) => {
  return filterValue === ALL_RIGHTS_RESERVED_KEY ? item.mediaLibraryItem.allRightsReserved : item.mediaLibraryItem.licenses.includes(filterValue);
}, { defaultValue: null, skipFilterIf: filterValue => !filterValue });
const usageFilter = createTextFilter('usage', (item, filterValue) => filterValue.test(item.usage), { prepareFilterValue: filterValue => usageFilterValueToRegExpMemoized(filterValue) });
const createdFromFilter = createDateFilter('createdFrom', (item, filterValue) => new Date(item.mediaLibraryItem.createdOn) >= filterValue);
const createdUntilFilter = createDateFilter('createdUntil', (item, filterValue) => new Date(item.mediaLibraryItem.createdOn) <= filterValue);

// Library only filters:
const updatedFromFilter = createDateFilter('updatedFrom', (item, filterValue) => new Date(item.mediaLibraryItem.updatedOn) >= filterValue);
const updatedUntilFilter = createDateFilter('updatedUntil', (item, filterValue) => new Date(item.mediaLibraryItem.updatedOn) <= filterValue);

// Trash only filters:
const deletedFromFilter = createDateFilter('deletedFrom', (item, filterValue) => new Date(item.mediaTrashItem.createdOn) >= filterValue);
const deletedUntilFilter = createDateFilter('deletedUntil', (item, filterValue) => new Date(item.mediaTrashItem.createdOn) <= filterValue);
const expiresFromFilter = createDateFilter('expiresFrom', (item, filterValue) => new Date(item.mediaLibraryItem.expiresOn) >= filterValue);
const expiresUntilFilter = createDateFilter('expiresUntil', (item, filterValue) => new Date(item.mediaLibraryItem.expiresOn) <= filterValue);

const mediaLibraryFilteringParams = {
  filters: [createdFromFilter, createdUntilFilter, updatedFromFilter, updatedUntilFilter, licenseFilter, textFilter, usageFilter]
};

const mediaTrashFilteringParams = {
  filters: [createdFromFilter, createdUntilFilter, deletedFromFilter, deletedUntilFilter, expiresFromFilter, expiresUntilFilter, licenseFilter, textFilter, usageFilter]
};

// Common sorters:
const nameSorter = createSorter('name', 'common:name', 'common:sortedByName', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.name, { direction, ignoreCase: true })));
const createdOnSorter = createSorter('createdOn', 'common:creationDate', 'common:sortedByCreatedOn', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.createdOn, { direction })));
const creatorSorter = createSorter('creator', 'common:creator', 'common:sortedByCreator', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.createdBy.displayName, { direction, ignoreCase: true })));
const sizeSorter = createSorter('size', 'common:size', 'common:sortedBySize', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.size, { direction })));
const typeSorter = createSorter('type', 'common:type', 'common:sortedByType', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.resourceType, { direction })));

// Library only sorters:
const updatedOnSorter = createSorter('updatedOn', 'common:updateDate', 'common:sortedByUpdatedOn', (items, direction) => [...items].sort(by(item => item.mediaLibraryItem.updatedOn, { direction })));

// Trash only sorters:
const deletedOnSorter = createSorter('deletedOn', 'common:deletionDate', 'common:sortedByDeletedOn', (items, direction) => [...items].sort(by(item => item.mediaTrashItem.createdOn, { direction })));
const expiresOnSorter = createSorter('expiresOn', 'common:expirationDate', 'common:sortedByExpiresOn', (items, direction) => [...items].sort(by(item => item.mediaTrashItem.expiresOn, { direction })));

const mediaLibrarySortingParams = {
  sorters: [nameSorter, createdOnSorter, updatedOnSorter, creatorSorter, sizeSorter, typeSorter],
  defaultSorter: updatedOnSorter,
  defaultDirection: SORTING_DIRECTION.desc
};

const mediaTrashSortingParams = {
  sorters: [nameSorter, createdOnSorter, deletedOnSorter, expiresOnSorter, creatorSorter, sizeSorter, typeSorter],
  defaultSorter: deletedOnSorter,
  defaultDirection: SORTING_DIRECTION.desc
};

function getMediaLibraryItemsModalDefaultState() {
  return {
    mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.none,
    mediaLibraryItem: null,
    mediaTrashItem: null,
    isOpen: false
  };
}

function getMediaLibraryItemUsageModalDefaultState() {
  return {
    mediaLibraryItemName: null,
    isOpen: false
  };
}

function ContentManagementMediaItemsTab({ tab }) {
  const user = useUser();
  const [allItems, setAllItems] = useState([]);
  const { dateFormat, formatDate } = useDateFormat();
  const [displayedItems, setDisplayedItems] = useState([]);
  const [selectedItemKeys, setSelectedItemKeys] = useState([]);
  const { t } = useTranslation('contentManagementMediaItemsTab');
  const mediaTrashApiClient = useSessionAwareApiClient(MediaTrashApiClient);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [isFetchingItems, setIsFetchingItems] = useDebouncedFetchingState(true);
  const [mediaLibraryItemsModalState, setMediaLibraryItemsModalState] = useState(getMediaLibraryItemsModalDefaultState());
  const [mediaLibraryItemUsageModalState, setMediaLibraryItemUsageModalState] = useState(getMediaLibraryItemUsageModalDefaultState());

  const isTrashTab = tab === TAB.mediaTrash;
  const isLibraryTab = tab === TAB.mediaLibrary;

  const initialQuery = useInitialQuery(query => query.tab === tab ? query : {});

  const filteringParams = isTrashTab ? mediaTrashFilteringParams : mediaLibraryFilteringParams;
  const { filteringConfiguration } = useFilteringConfiguration(filteringParams.filters);

  const sortingParams = isTrashTab ? mediaTrashSortingParams : mediaLibrarySortingParams;
  const { sortingConfiguration, sortingSelectorOptions } = useSortingConfiguration(sortingParams.sorters, sortingParams.defaultSorter, sortingParams.defaultDirection, t);

  const { filtering, getTextFilterValue, getRangePickerFilterValues, handleTextFilterChange, handleDateRangeFilterChange, filterItems } = useFiltering(initialQuery, filteringConfiguration);
  const { sorting, handleSortingSelectorChange, sortItems } = useSorting(initialQuery, sortingConfiguration);
  const { paging, handleAntdTableChange, adjustPagingToItems } = usePaging(initialQuery);

  const fetchItems = useCallback(async () => {
    try {
      setIsFetchingItems(true);
      const apiClientResponse = await mediaLibraryApiClient.getContentManagementMediaLibraryItems({ fromTrash: isTrashTab });
      setAllItems(apiClientResponse.items);
    } finally {
      setIsFetchingItems(false);
    }
  }, [setIsFetchingItems, mediaLibraryApiClient, isTrashTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [paging]);

  useEffect(() => {
    history.replaceState(null, '', routes.getContentManagementUrl(tab, {
      ...filtering.query,
      ...sorting.query,
      ...paging.query
    }));
  }, [tab, filtering, sorting, paging]);

  useEffect(() => {
    setSelectedItemKeys([]);
  }, [displayedItems, filtering, sorting, paging]);

  useEffect(() => {
    if (isFetchingItems) {
      return;
    }

    const newDisplayedItems = sortItems(filterItems(allItems));

    setSelectedItemKeys([]);
    setDisplayedItems(newDisplayedItems);
    adjustPagingToItems(newDisplayedItems);
  }, [isFetchingItems, allItems, filterItems, sortItems, adjustPagingToItems]);

  const handleSelectedRowKeysChange = newSelectedKeys => {
    setSelectedItemKeys(newSelectedKeys);
  };

  const handleViewItemUsageClick = item => {
    setMediaLibraryItemUsageModalState({
      mediaLibraryItemName: item.mediaLibraryItem.name,
      isOpen: true
    });
  };

  const handlePreviewItemClick = item => {
    setMediaLibraryItemsModalState({
      mode: isTrashTab ? MEDIA_LIBRARY_ITEMS_MODAL_MODE.trashPreview :  MEDIA_LIBRARY_ITEMS_MODAL_MODE.preview,
      mediaLibraryItem: item.mediaLibraryItem,
      mediaTrashItem: item.mediaTrashItem,
      isOpen: true
    });
  };

  const handleEditMediaLibraryItemClick = item => {
    setMediaLibraryItemsModalState({
      mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.update,
      mediaLibraryItem: item.mediaLibraryItem,
      mediaTrashItem: null,
      isOpen: true
    });
  };

  const handleDeleteMediaLibraryItemClick = item => {
    confirmMediaFileSoftDelete(t, item.mediaLibraryItem.name, async () => {
      try {
        await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: item.mediaLibraryItem._id });
        setAllItems(oldItems => ensureIsExcluded(oldItems, item));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleDeleteMediaTrashItemClick = item => {
    confirmMediaFileHardDelete(t, item.mediaLibraryItem.name, async () => {
      try {
        await mediaTrashApiClient.deleteMediaTrashItem({ mediaTrashItemId: item.mediaTrashItem._id });
        setAllItems(oldItems => ensureIsExcluded(oldItems, item));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleRestoreMediaTrashItemClick = item => {
    confirmMediaFileRestore(t, item.mediaLibraryItem.name, async () => {
      try {
        await mediaTrashApiClient.restoreMediaTrashItem({ mediaTrashItemId: item.mediaTrashItem._id });
        setAllItems(oldItems => ensureIsExcluded(oldItems, item));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleDeleteSelectedMediaLibraryItemsClick = () => {
    const items = allItems.filter(item => selectedItemKeys.includes(item.key));
    const itemNames = items.map(item => item.mediaLibraryItem.name);
    confirmMediaFileSoftDelete(t, itemNames, async () => {
      try {
        for (const item of items) {
          await mediaLibraryApiClient.deleteMediaLibraryItem({ mediaLibraryItemId: item.mediaLibraryItem._id });
        }
        setAllItems(oldItems => ensureAreExcluded(oldItems, items));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleDeleteSelectedMediaTrashItemsClick = () => {
    const items = allItems.filter(item => selectedItemKeys.includes(item.key));
    const itemNames = items.map(item => item.mediaLibraryItem.name);
    confirmMediaFileHardDelete(t, itemNames, async () => {
      try {
        for (const item of items) {
          await mediaTrashApiClient.deleteMediaTrashItem({ mediaTrashItemId: item.mediaTrashItem._id });
        }
        setAllItems(oldItems => ensureAreExcluded(oldItems, items));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleRestoreSelectedMediaTrashItemsClick = () => {
    const items = allItems.filter(item => selectedItemKeys.includes(item.key));
    const itemNames = items.map(item => item.mediaLibraryItem.name);
    confirmMediaFileRestore(t, itemNames, async () => {
      try {
        for (const item of items) {
          await mediaTrashApiClient.restoreMediaTrashItem({ mediaTrashItemId: item.mediaTrashItem._id });
        }
        setAllItems(oldItems => ensureAreExcluded(oldItems, items));
        message.success(t('common:changesSavedSuccessfully'));
      } catch (error) {
        handleApiError({ error, logger, t });
      }
    });
  };

  const handleCreateMediaLibraryItemsClick = () => {
    setMediaLibraryItemsModalState({
      mode: MEDIA_LIBRARY_ITEMS_MODAL_MODE.create,
      mediaLibraryItem: null,
      mediaTrashItem: null,
      isOpen: true
    });
  };

  const handleMediaLibraryItemsModalCreated = () => {
    fetchItems();
  };

  const handleMediaLibraryItemsModalUpdated = () => {
    setMediaLibraryItemsModalState(getMediaLibraryItemsModalDefaultState());
    fetchItems();
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

  const renderItem = (_, item) => {
    return (
      <div>
        <div className="ContentManagementMediaItemsTab-iconAndName">
          <div><ResourceTypeIcon searchResourceType={item.mediaLibraryItem.resourceType} /></div>
          <div className="ContentManagementMediaItemsTab-name" title={item.mediaLibraryItem.name}>{item.mediaLibraryItem.name}</div>
        </div>
        {!!isLibraryTab && (
          <div className="ContentManagementMediaItemsTab-datesAndUsers">
            <span>{`${t('common:createdOnDateBy', { date: formatDate(item.mediaLibraryItem.createdOn, 'L') })} `}</span>
            <a href={routes.getUserProfileUrl(item.mediaLibraryItem.createdBy._id)}>{item.mediaLibraryItem.createdBy.displayName}</a>
            <span>&nbsp;|&nbsp;</span>
            <span>{`${t('common:updatedOnDateBy', { date: formatDate(item.mediaLibraryItem.updatedOn, 'L') })} `}</span>
            <a href={routes.getUserProfileUrl(item.mediaLibraryItem.updatedBy._id)}>{item.mediaLibraryItem.updatedBy.displayName}</a>
          </div>
        )}
        {!!isTrashTab && (
          <div className="ContentManagementMediaItemsTab-datesAndUsers">
            <span>{`${t('common:deletedOnDateBy', { date: formatDate(item.mediaTrashItem.createdOn, 'L') })} `}</span>
            <a href={routes.getUserProfileUrl(item.mediaTrashItem.createdBy._id)}>{item.mediaTrashItem.createdBy.displayName}</a>
            <span>&nbsp;|&nbsp;</span>
            <span>{`${t('common:expiresOnDate', { date: formatDate(item.mediaTrashItem.expiresOn, 'L') })} `}</span>
          </div>
        )}
        <div className="ContentManagementMediaItemsTab-tags">
          <TagsExpander tags={item.mediaLibraryItem.tags} initialTagCount={5} small />
        </div>
      </div>
    );
  };

  const renderUsage = (_, item) => (
    <div>{item.usage}</div>
  );

  const renderActions = (_, item) => {
    return (
      <div>
        <ActionButtonGroup>
          <ActionButton
            title={t('common:usageOverview')}
            icon={<InfoIcon />}
            intent={ACTION_BUTTON_INTENT.info}
            onClick={() => handleViewItemUsageClick(item)}
            />
          <ActionButton
            title={t('common:preview')}
            icon={<PreviewIcon />}
            intent={ACTION_BUTTON_INTENT.default}
            onClick={() => handlePreviewItemClick(item)}
            />
          {!!isLibraryTab && (
            <ActionButton
              title={t('common:edit')}
              icon={<EditIcon />}
              intent={ACTION_BUTTON_INTENT.default}
              onClick={() => handleEditMediaLibraryItemClick(item)}
              />
          )}
          {!!isLibraryTab && hasUserPermission(user, permissions.DELETE_PUBLIC_CONTENT) && (
            <ActionButton
              title={t('common:delete')}
              icon={<DeleteIcon />}
              intent={ACTION_BUTTON_INTENT.error}
              onClick={() => handleDeleteMediaLibraryItemClick(item)}
              />
          )}
          {!!isTrashTab && hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT) && (
            <Fragment>
              <ActionButton
                title={t('common:restore')}
                icon={<RestoreIcon />}
                intent={ACTION_BUTTON_INTENT.success}
                onClick={() => handleRestoreMediaTrashItemClick(item)}
                />
              <ActionButton
                title={t('common:delete')}
                icon={<DeleteIcon />}
                intent={ACTION_BUTTON_INTENT.error}
                onClick={() => handleDeleteMediaTrashItemClick(item)}
                />
            </Fragment>
          )}
        </ActionButtonGroup>
      </div>
    );
  };

  const columns = [
    {
      title: t('itemColumnHeader'),
      key: 'item',
      render: renderItem
    },
    {
      title: t('common:usage'),
      key: 'usage',
      render: renderUsage,
      responsive: ['md'],
      width: '96px'
    },
    {
      title: t('common:actions'),
      key: 'actions',
      render: renderActions,
      width: '148px'
    }
  ];

  const filterClassName = isTrashTab
    ? 'ContentManagementMediaItemsTab-filters ContentManagementMediaItemsTab-filters--mediaTrashItems'
    : 'ContentManagementMediaItemsTab-filters ContentManagementMediaItemsTab-filters--mediaLibraryItems';

  return (
    <div className="ContentManagementMediaItemsTab">
      <div className={filterClassName}>
        {!!filteringConfiguration.filtersByName.text && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--text">
            <div>{t('textFilterLabel')}</div>
            <FilterInput
              disabled={isFetchingItems}
              value={getTextFilterValue('text')}
              placeholder={t('textFilterPlaceholder')}
              className="ContentManagementMediaItemsTab-filterControl"
              onChange={event => handleTextFilterChange('text', event.target.value)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.license && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--license">
            <div>{t('common:license')}</div>
            <LicenseSelect
              allowClear
              includeAllRightsReserved
              disabled={isFetchingItems}
              value={getTextFilterValue('license')}
              placeholder={t('licenseFilterPlaceholder')}
              className="ContentManagementMediaItemsTab-filterControl"
              onChange={newValue => handleTextFilterChange('license', newValue)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.usage && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--usage">
            <div>{t('common:usage')}</div>
            <MediaUsageSelect
              disabled={isFetchingItems}
              value={getTextFilterValue('usage')}
              className="ContentManagementMediaItemsTab-filterControl"
              onChange={newValue => handleTextFilterChange('usage', newValue)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.createdFrom && !!filteringConfiguration.filtersByName.createdUntil && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--creationDate">
            <div>{t('common:creationDate')}</div>
            <RangePicker
              allowClear
              allowEmpty
              format={dateFormat}
              disabled={isFetchingItems}
              disabledDate={determineDisabledDate}
              className="ContentManagementMediaItemsTab-filterControl"
              placeholder={[t('common:fromDate'), t('common:untilDate')]}
              value={getRangePickerFilterValues(['createdFrom', 'createdUntil'])}
              onChange={newValues => handleDateRangeFilterChange(['createdFrom', 'createdUntil'], newValues)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.updatedFrom && !!filteringConfiguration.filtersByName.updatedUntil && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--updateDate">
            <div>{t('common:updateDate')}</div>
            <RangePicker
              allowClear
              allowEmpty
              format={dateFormat}
              disabled={isFetchingItems}
              disabledDate={determineDisabledDate}
              className="ContentManagementMediaItemsTab-filterControl"
              placeholder={[t('common:fromDate'), t('common:untilDate')]}
              value={getRangePickerFilterValues(['updatedFrom', 'updatedUntil'])}
              onChange={newValues => handleDateRangeFilterChange(['updatedFrom', 'updatedUntil'], newValues)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.deletedFrom && !!filteringConfiguration.filtersByName.deletedUntil && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--deletionDate">
            <div>{t('common:deletionDate')}</div>
            <RangePicker
              allowClear
              allowEmpty
              format={dateFormat}
              disabled={isFetchingItems}
              disabledDate={determineDisabledDate}
              className="ContentManagementMediaItemsTab-filterControl"
              placeholder={[t('common:fromDate'), t('common:untilDate')]}
              value={getRangePickerFilterValues(['deletedFrom', 'deletedUntil'])}
              onChange={newValues => handleDateRangeFilterChange(['deletedFrom', 'deletedUntil'], newValues)}
              />
          </div>
        )}
        {!!filteringConfiguration.filtersByName.expiresFrom && !!filteringConfiguration.filtersByName.expiresUntil && (
          <div className="ContentManagementMediaItemsTab-filter ContentManagementMediaItemsTab-filter--expirationDate">
            <div>{t('common:expirationDate')}</div>
            <RangePicker
              allowClear
              allowEmpty
              format={dateFormat}
              disabled={isFetchingItems}
              disabledDate={determineDisabledDate}
              className="ContentManagementMediaItemsTab-filterControl"
              placeholder={[t('common:fromDate'), t('common:untilDate')]}
              value={getRangePickerFilterValues(['expiresFrom', 'expiresUntil'])}
              onChange={newValues => handleDateRangeFilterChange(['expiresFrom', 'expiresUntil'], newValues)}
              />
          </div>
        )}
      </div>
      <div className="ContentManagementMediaItemsTab-sorting">
        <SortingSelector
          size="large"
          sorting={sorting.sortingSelectorSorting}
          options={sortingSelectorOptions}
          onChange={handleSortingSelectorChange}
          />
      </div>
      <div className="ContentManagementMediaItemsTab-buttons">
        <div className="ContentManagementMediaItemsTab-buttonsLeft">
          {!!isLibraryTab && hasUserPermission(user, permissions.DELETE_PUBLIC_CONTENT) && (
            <Button
              danger
              type="primary"
              icon={<DeleteIcon />}
              disabled={isFetchingItems || !selectedItemKeys.length}
              onClick={handleDeleteSelectedMediaLibraryItemsClick}
              >
              {t('softDeleteItems')}
            </Button>
          )}
          {!!isTrashTab && hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT) && (
            <Button
              danger
              type="primary"
              icon={<DeleteIcon />}
              disabled={isFetchingItems || !selectedItemKeys.length}
              onClick={handleDeleteSelectedMediaTrashItemsClick}
              >
              {t('hardDeleteItems')}
            </Button>
          )}
          {!!isTrashTab && hasUserPermission(user, permissions.MANAGE_DELETED_PUBLIC_CONTENT) && (
            <Button
              type="primary"
              icon={<RestoreIcon />}
              disabled={isFetchingItems || !selectedItemKeys.length}
              onClick={handleRestoreSelectedMediaTrashItemsClick}
              >
              {t('restoreItems')}
            </Button>
          )}
        </div>
        <div className="ContentManagementMediaItemsTab-buttonsRight">
          {!!isLibraryTab && (
            <Button
              type="primary"
              disabled={isFetchingItems}
              onClick={handleCreateMediaLibraryItemsClick}
              >
              {t('common:create')}
            </Button>
          )}
        </div>
      </div>
      <Table
        size="small"
        columns={columns}
        rowSelection={{
          preserveSelectedRowKeys: false,
          selectedRowKeys: selectedItemKeys,
          onChange: handleSelectedRowKeysChange
        }}
        loading={isFetchingItems}
        dataSource={displayedItems}
        pagination={paging.antdTablePagination}
        className="ContentManagementMediaItemsTab-table u-table-with-pagination"
        onChange={handleAntdTableChange}
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

ContentManagementMediaItemsTab.propTypes = {
  tab: PropTypes.oneOf([TAB.mediaLibrary, TAB.mediaTrash]).isRequired
};

export default ContentManagementMediaItemsTab;

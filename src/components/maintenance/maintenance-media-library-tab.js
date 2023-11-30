import by from 'thenby';
import dayjs from 'dayjs';
import Info from '../info.js';
import PropTypes from 'prop-types';
import Markdown from '../markdown.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import TagsExpander from '../tags-expander.js';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceTypeCell from '../resource-type-cell.js';
import { SORTING_DIRECTION, TAB } from './constants.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import ResourceTitleCell from '../resource-title-cell.js';
import { handleApiError } from '../../ui/error-helper.js';
import PreviewIcon from '../icons/general/preview-icon.js';
import { RESOURCE_USAGE } from '../../domain/constants.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import { getResourceTypeTranslation } from '../../utils/resource-utils.js';
import { Button, Collapse, message, Table, Radio, DatePicker } from 'antd';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import { confirmBulkDeleteMediaItems, confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import { ensureAreExcluded, ensureIsExcluded, ensureIsIncluded, replaceItem } from '../../utils/array-utils.js';
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
  const { dateFormat } = useDateFormat();
  const { t } = useTranslation('maintenanceMediaLibraryTab');
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const requestQuery = useMemo(() => getSanitizedQueryFromRequest(request), [request]);

  const [usage, setUsage] = useState(requestQuery.usage);
  const [filter, setFilter] = useState(requestQuery.filter);
  const [createdBefore, setCreatedBefore] = useState(requestQuery.createdBefore);
  const [pagination, setPagination] = useState({ page: requestQuery.page, pageSize: requestQuery.pageSize });
  const [sorting, setSorting] = useState({ value: requestQuery.sorting, direction: requestQuery.direction });

  const [allRows, setAllRows] = useState([]);
  const [displayedRows, setDisplayedRows] = useState([]);
  const [mediaLibraryItemModalState, setMediaLibraryItemModalState] = useState(getMediaLibraryItemModalState({}));

  const [renderingRows, setRenderingRows] = useState(false);

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

    history.replaceState(null, '', routes.getMaintenanceUrl(TAB.mediaLibrary, queryParams));
  }, [filter, sorting, createdBefore, usage, pagination]);

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
    let filteredRows = filterRows(allRows, filter);

    if (createdBefore) {
      filteredRows = filteredRows
        .filter(row => row.usage === usage && new Date(row.createdOn) < createdBefore);
    }

    const sorter = tableSorters[sorting.value];
    const sortedRows = sorter ? sorter(filteredRows, sorting.direction) : filteredRows;

    setRenderingRows(!!sortedRows.length);
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

  const handlePreviewItemClick = row => {
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
          onMediaLibraryItemsChange(oldItems => ensureAreExcluded(oldItems, deletedMediaLibraryItems));
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

  const isBulkDeleteDisabled = !createdBefore || !displayedRows.length;

  return (
    <div className="MaintenanceMediaLibraryTab">
      <div className="MaintenanceMediaLibraryTab-filterControls">
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
      <div className="MaintenanceMediaLibraryTab-bulkDeletePanel">
        <Collapse size="small" expandIconPosition="end">
          <Collapse.Panel
            header={
              <div className="MaintenanceMediaLibraryTab-bulkDeletePanelHeader">
                {t('bulkDeletePanelHeader')}
              </div>
            }
            >
            <div className="MaintenanceMediaLibraryTab-bulkDeletePanelContent">
              <div className="MaintenanceMediaLibraryTab-bulkDeletePanelFilters">
                <div>{t('createdBefore')}</div>
                <DatePicker
                  showTime={false}
                  format={dateFormat}
                  placeholder={t('datePlaceholder')}
                  disabledDate={determineDisabledDate}
                  value={createdBefore ? dayjs(createdBefore) : null}
                  onChange={handleCreatedBeforeFilterChange}
                  />
                <div>{t('and')}</div>
                <Info
                  iconAfterContent
                  tooltip={<Markdown>{t('usageInfoMarkdown')}</Markdown>}
                  className="MaintenanceMediaLibraryTab-bulkDeletePanelRadios"
                  >
                  <Radio.Group value={usage} disabled={!createdBefore} onChange={handleUsageChange}>
                    <Radio.Button value={RESOURCE_USAGE.unused}>{t('unused')}</Radio.Button>
                    <Radio.Button value={RESOURCE_USAGE.deprecated}>{t('deprecated')}</Radio.Button>
                  </Radio.Group>
                </Info>
              </div>
              <div className="MaintenanceMediaLibraryTab-bulkDeletePanelButton">
                <Button disabled={isBulkDeleteDisabled} danger type="primary" onClick={handleBulkDeleteClick}>
                  {!!isBulkDeleteDisabled && t('delete')}
                  {!isBulkDeleteDisabled && t('deleteCount', { count: displayedRows.length })}
                </Button>
              </div>
            </div>
          </Collapse.Panel>
        </Collapse>
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

import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
import { Button, message, Table, Tag } from 'antd';
import EditIcon from '../icons/general/edit-icon.js';
import SortingSelector from '../sorting-selector.js';
import { useDateFormat } from '../locale-context.js';
import ResourceInfoCell from '../resource-info-cell.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
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

function filterRow(row, lowerCasedFilterText) {
  return row.displayName.toLowerCase().includes(lowerCasedFilterText)
    || row.tags.some(tag => tag.toLowerCase().includes(lowerCasedFilterText))
    || row.licenses.some(license => license.toLowerCase().includes(lowerCasedFilterText))
    || row.createdBy.displayName.toLowerCase().includes(lowerCasedFilterText)
    || row.updatedBy.displayName.toLowerCase().includes(lowerCasedFilterText);
}

function filterRows(rows, filterText) {
  const lowerCasedFilterText = filterText.toLowerCase().trim();
  return lowerCasedFilterText ? rows.filter(row => filterRow(row, lowerCasedFilterText)) : rows;
}

function RedactionMediaLibraryTab({ mediaLibraryItems, onMediaLibraryItemsChange }) {
  const { formatDate } = useDateFormat();
  const [filterText, setFilterText] = useState('');
  const [allTableRows, setAllTableRows] = useState([]);
  const { t } = useTranslation('redactionMediaLibraryTab');
  const [currentPagination, setCurrentPagination] = useState(1);
  const [displayedTableRows, setDisplayedTableRows] = useState([]);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [currentTableSorting, setCurrentTableSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [mediaLibraryItemModalState, setMediaLibraryItemModalState] = useState(getMediaLibraryItemModalState({}));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [currentPagination]);

  useEffect(() => {
    setAllTableRows(createTableRows(mediaLibraryItems, t));
  }, [mediaLibraryItems, t]);

  const sortingOptions = useMemo(() => {
    const options = [
      { label: t('common:name'), appliedLabel: t('common:sortedByName'), value: 'name' },
      { label: t('common:createdOn'), appliedLabel: t('common:sortedByCreatedOn'), value: 'createdOn' },
      { label: t('common:updatedOn'), appliedLabel: t('common:sortedByUpdatedOn'), value: 'updatedOn' },
      { label: t('common:user'), appliedLabel: t('common:sortedByCreator'), value: 'user' },
      { label: t('common:size'), appliedLabel: t('common:sortedBySize'), value: 'size' },
      { label: t('common:type'), appliedLabel: t('common:sortedByType'), value: 'type' }
    ];

    return options;
  }, [t]);

  const tableSorters = useMemo(() => ({
    name: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.displayName, { direction, ignoreCase: true })),
    createdOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdOn, direction)),
    updatedOn: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.updatedOn, direction)),
    user: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.createdBy.displayName, { direction, ignoreCase: true })),
    size: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.size, direction)),
    type: (rowsToSort, direction) => [...rowsToSort].sort(by(row => row.translatedResourceType, { direction, ignoreCase: true }))
  }), []);

  useEffect(() => {
    const filteredRows = filterRows(allTableRows, filterText);
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

  const handleInfoCellTitleClick = row => {
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
    confirmMediaFileHardDelete(t, mediaLibraryItem.displayName, async () => {
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

  const renderName = (_, row) => {
    return (
      <ResourceInfoCell
        url={row.url}
        title={row.displayName}
        description={row.description}
        subtext={
          <div className="RedactionDocumentsTab-titleSubtext">
            <div>
              <span>{`${t('common:createdOnBy', { date: formatDate(row.createdOn) })} `}</span>
              <a href={routes.getUserProfileUrl(row.createdBy._id)}>{row.createdBy.displayName}</a>
            </div>
            <div>
              <span>{`${t('common:updatedOnBy', { date: formatDate(row.updatedOn) })} `}</span>
              <a href={routes.getUserProfileUrl(row.updatedBy._id)}>{row.updatedBy.displayName}</a>
            </div>
          </div>
        }
        onTitleClick={() => handleInfoCellTitleClick(row)}
        />
    );
  };

  const renderTagsOrLicenses = tagsOrLicenses => (
    <div>
      <ItemsExpander
        className="RedactionMediaLibraryTab-cellTags"
        expandLinkClassName="RedactionMediaLibraryTab-cellTagsExpandLink"
        items={tagsOrLicenses}
        renderItem={tagOrLicense => <Tag className="Tag" key={tagOrLicense}>{tagOrLicense}</Tag>}
        />
    </div>
  );

  const renderActions = (_actions, row) => {
    return (
      <div>
        <ActionButtonGroup>
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

  const tableColumns = [
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
      width: '200px'
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
    <div className="RedactionMediaLibraryTab">
      <div className="RedactionMediaLibraryTab-controls">
        <FilterInput
          size="large"
          className="RedactionMediaLibraryTab-filter"
          value={filterText}
          onChange={handleFilterTextChange}
          placeholder={t('filterPlaceholder')}
          />
        <SortingSelector
          size="large"
          sorting={currentTableSorting}
          options={sortingOptions}
          onChange={handleCurrentTableSortingChange}
          />
        <Button type="primary" onClick={handleCreateItemClick}>
          {t('common:upload')}
        </Button>
      </div>
      <Table
        dataSource={[...displayedTableRows]}
        columns={tableColumns}
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

RedactionMediaLibraryTab.propTypes = {
  mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired,
  onMediaLibraryItemsChange: PropTypes.func.isRequired
};

export default RedactionMediaLibraryTab;

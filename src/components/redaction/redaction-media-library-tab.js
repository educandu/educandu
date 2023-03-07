import by from 'thenby';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { message, Table, Tag } from 'antd';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { useUser } from '../user-context.js';
import { useTranslation } from 'react-i18next';
import ItemsExpander from '../items-expander.js';
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
import { ensureIsExcluded, replaceItem } from '../../utils/array-utils.js';
import permissions, { hasUserPermission } from '../../domain/permissions.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import ActionButton, { ActionButtonGroup, ACTION_BUTTON_INTENT } from '../action-button.js';
import MediaLibaryMetadataModal, { MEDIA_LIBRARY_METADATA_MODAL_MODE } from '../resource-selector/media-library/media-library-item-modal.js';

const logger = new Logger(import.meta.url);

function getDocumentMetadataModalState({ mode = MEDIA_LIBRARY_METADATA_MODAL_MODE.preview, mediaLibraryItem = null, isOpen = false }) {
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
  const user = useUser();
  const { formatDate } = useDateFormat();
  const [filterText, setFilterText] = useState('');
  const [allTableRows, setAllTableRows] = useState([]);
  const { t } = useTranslation('redactionMediaLibraryTab');
  const [displayedTableRows, setDisplayedTableRows] = useState([]);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);
  const [currentTableSorting, setCurrentTableSorting] = useState({ value: 'updatedOn', direction: 'desc' });
  const [resourceMetadataModalState, setDocumentMetadataModalState] = useState(getDocumentMetadataModalState({}));

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

    if (hasUserPermission(user, permissions.ARCHIVE_DOC)) {
      options.push({ label: t('common:archived'), appliedLabel: t('common:sortedByArchived'), value: 'archived' });
    }

    return options;
  }, [user, t]);

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

  const handleCurrentTableSortingChange = ({ value, direction }) => {
    setCurrentTableSorting({ value, direction });
  };

  const handleFilterTextChange = event => {
    const newFilterText = event.target.value;
    setFilterText(newFilterText);
  };

  const handleInfoCellTitleClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setDocumentMetadataModalState(getDocumentMetadataModalState({ mode: MEDIA_LIBRARY_METADATA_MODAL_MODE.preview, mediaLibraryItem, isOpen: true }));
  };

  const handleDocumentEditClick = row => {
    const mediaLibraryItem = mediaLibraryItems.find(item => item._id === row.key);
    setDocumentMetadataModalState(getDocumentMetadataModalState({ mode: MEDIA_LIBRARY_METADATA_MODAL_MODE.edit, mediaLibraryItem, isOpen: true }));
  };

  const handleDocumentDeleteClick = row => {
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

  const handleDocumentMetadataModalSave = savedItem => {
    setDocumentMetadataModalState(previousState => ({ ...previousState, isOpen: false }));
    onMediaLibraryItemsChange(oldItems => replaceItem(oldItems, savedItem));
  };

  const handleDocumentMetadataModalClose = () => {
    setDocumentMetadataModalState(previousState => ({ ...previousState, isOpen: false }));
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
            onClick={() => handleDocumentEditClick(row)}
            />
          <ActionButton
            title={t('common:delete')}
            icon={<DeleteIcon />}
            intent={ACTION_BUTTON_INTENT.error}
            onClick={() => handleDocumentDeleteClick(row)}
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
      </div>
      <Table
        dataSource={[...displayedTableRows]}
        columns={tableColumns}
        />
      <MediaLibaryMetadataModal
        {...resourceMetadataModalState}
        onSave={handleDocumentMetadataModalSave}
        onClose={handleDocumentMetadataModalClose}
        />
    </div>
  );
}

RedactionMediaLibraryTab.propTypes = {
  mediaLibraryItems: PropTypes.arrayOf(mediaLibraryItemShape).isRequired,
  onMediaLibraryItemsChange: PropTypes.func.isRequired
};

export default RedactionMediaLibraryTab;

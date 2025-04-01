import by from 'thenby';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import EmptyState from '../empty-state.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { Button, Spin, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import { useIsMounted } from '../../ui/hooks.js';
import { DownloadIcon } from '../icons/icons.js';
import { useService } from '../container-context.js';
import FilterIcon from '../icons/general/filter-icon.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import HttpClient from '../../api-clients/http-client.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { handleApiError, handleError } from '../../ui/error-helper.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { getResourceIconByResourceType } from '../../utils/resource-utils.js';
import { useRoomMediaContext, useSetRoomMediaContext } from '../room-media-context.js';
import PrivateIcon from '../icons/general/private-icon.js';

const logger = new Logger(import.meta.url);

const MIN_DOWNLOAD_INTERVAL_IN_MS = 2000;

export default function RoomMedia({ roomId }) {
  const isMounted = useIsMounted();
  const { uiLocale } = useLocale();
  const { t } = useTranslation('roomMedia');
  const httpClient = useService(HttpClient);
  const roomMediaContext = useRoomMediaContext();
  const setRoomMediaContext = useSetRoomMediaContext();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState(null);
  const [roomMediaItems, setRoomMediaItems] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filteredRoomMediaItems, setFilteredRoomMediaItems] = useState([]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const singleRoomMediaOverview = await roomApiClient.getSingleRoomMediaOverview({ roomId });
      setRoomMediaItems(singleRoomMediaOverview.roomStorage.roomMediaItems);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  }, [roomId, roomApiClient, t]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();
    const newFilteredRoomMediaItems = roomMediaItems
      .filter(item => !lowerCasedFilter || item.name.toLowerCase().includes(lowerCasedFilter))
      .sort(by(item => item.name));

    setFilteredRoomMediaItems(newFilteredRoomMediaItems);
  }, [roomMediaItems, filterText]);

  const downloadRoomMediaItems = async roomMediaItemsToDownload => {
    try {
      setIsDownloading(true);
      for (const roomMediaItem of roomMediaItemsToDownload) {
        await Promise.all([
          httpClient.download(roomMediaItem.url, roomMediaItem.name, true),
          new Promise(resolve => { setTimeout(resolve, MIN_DOWNLOAD_INTERVAL_IN_MS); })
        ]);
        if (!isMounted.current) {
          break;
        }
      }
    } catch (error) {
      handleError({ error, logger, t });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFilterTextChange = event => {
    const { value } = event.target;
    setFilterText(value);
  };

  const handleDeleteRoomMediaItem = async roomMediaItem => {
    setIsSaving(true);
    try {
      const singleRoomMediaOverview = await roomApiClient.deleteRoomMedia({ roomId, roomMediaItemId: roomMediaItem._id });
      setRoomMediaItems(singleRoomMediaOverview.roomStorage.roomMediaItems);
      setRoomMediaContext(oldContext => ({ ...oldContext, singleRoomMediaOverview }));
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoomMediaItemsDownloadClick = () => {
    downloadRoomMediaItems(filteredRoomMediaItems);
  };

  const handleRoomMediaItemDownloadClick = roomMediaItem => {
    downloadRoomMediaItems([roomMediaItem]);
  };

  const handleRoomMediaItemDeleteClick = roomMediaItem => {
    confirmMediaFileHardDelete(t, roomMediaItem.name, () => handleDeleteRoomMediaItem(roomMediaItem));
  };

  const renderRoomMediaItem = roomMediaItem => {
    const canDelete = roomMediaContext?.isDeletionEnabled || false;
    const Icon = getResourceIconByResourceType({ resourceType: roomMediaItem.resourceType });

    return (
      <div key={roomMediaItem._id} className="RoomMedia-item">
        <div className="RoomMedia-itemMetadata">
          <div className="RoomMedia-itemIcon">
            <Icon />
          </div>
          <div className="RoomMedia-itemName">
            <a href={roomMediaItem.url} className="RoomMedia-itemLink">
              {roomMediaItem.name}
            </a>
          </div>
        </div>
        <div className="RoomMedia-itemActions">
          <div className="RoomMedia-itemSize">
            {prettyBytes(roomMediaItem.size, { locale: uiLocale })}
          </div>
          <Tooltip title={t('common:download')}>
            <Button
              type="text"
              size="small"
              icon={<DownloadIcon />}
              className="u-action-button"
              onClick={() => handleRoomMediaItemDownloadClick(roomMediaItem)}
              />
          </Tooltip>
          {!!canDelete && (
            <Tooltip title={t('common:delete')}>
              <Button
                type="text"
                size="small"
                icon={<DeleteIcon />}
                className="u-action-button u-danger-action-button"
                onClick={() => handleRoomMediaItemDeleteClick(roomMediaItem)}
                />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="RoomMedia">
      <Spin spinning={isLoading || isSaving || isDownloading}>
        {!roomMediaItems.length && (
          <EmptyState
            icon={<PrivateIcon />}
            title={t('emptyStateTitle')}
            subtitle={t('emptyStateSubtitle')}
            />
        )}
        {!!roomMediaItems.length && (
          <Fragment>
            <div className="RoomMedia-controls">
              <FilterInput
                className="RoomMedia-textFilter"
                value={filterText}
                onChange={handleFilterTextChange}
                />
              <Button
                type="primary"
                icon={<DownloadIcon />}
                disabled={!filteredRoomMediaItems.length}
                onClick={handleRoomMediaItemsDownloadClick}
                >
                {t('downloadAll')}
              </Button>
            </div>
            {!filteredRoomMediaItems.length && (
              <EmptyState
                icon={<FilterIcon />}
                title={t('common:filterResultEmptyStateTitle')}
                subtitle={t('common:searchOrFilterResultEmptyStateSubtitle')}
                />
            )}
            {filteredRoomMediaItems.map(renderRoomMediaItem)}
          </Fragment>
        )}
      </Spin>
    </div>
  );
}

RoomMedia.propTypes = {
  roomId: PropTypes.string.isRequired
};

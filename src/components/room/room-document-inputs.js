import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import EmptyState from '../empty-state.js';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import FilterInput from '../filter-input.js';
import { Button, Spin, Tooltip } from 'antd';
import { InputsIcon } from '../icons/icons.js';
import { useTranslation } from 'react-i18next';
import { CommentOutlined } from '@ant-design/icons';
import FilterIcon from '../icons/general/filter-icon.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useDateFormat, useLocale } from '../locale-context.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { confirmDocumentInputDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import DocumentInputApiClient from '../../api-clients/document-input-api-client.js';
import { useRoomMediaContext, useSetRoomMediaContext } from '../room-media-context.js';

const logger = new Logger(import.meta.url);

export default function RoomDocumentInputs({ roomId }) {
  const { uiLocale } = useLocale();
  const { formatDate } = useDateFormat();
  const roomMediaContext = useRoomMediaContext();
  const { t } = useTranslation('roomDocumentInputs');
  const setRoomMediaContext = useSetRoomMediaContext();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const documentInputApiClient = useSessionAwareApiClient(DocumentInputApiClient);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterText, setFilterText] = useState(null);
  const [documentInputs, setDocumentInputs] = useState([]);
  const [filteredDocumentInputs, setFilteredDocumentInputs] = useState([]);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const documentInputApiResponse = await documentInputApiClient.getDocumentInputsByRoomId(roomId);
      setDocumentInputs(documentInputApiResponse.documentInputs);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsLoading(false);
    }
  }, [roomId, documentInputApiClient, t]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const lowerCasedFilter = (filterText || '').toLowerCase();

    const newFilteredDocumentInputs = lowerCasedFilter
      ? documentInputs.filter(documentInput => {
        const matchesDocumentTitle = documentInput.documentTitle.toLowerCase().includes(lowerCasedFilter);
        const matchesUserDisplayName = documentInput.createdBy.displayName.toLowerCase().includes(lowerCasedFilter);
        return matchesDocumentTitle || matchesUserDisplayName;
      })
      : documentInputs;

    setFilteredDocumentInputs(newFilteredDocumentInputs);
  }, [documentInputs, filterText]);

  const handleFilterTextChange = event => {
    const { value } = event.target;
    setFilterText(value);
  };

  const handleDeleteDocumentInput = async documentInput => {
    setIsSaving(true);
    try {
      await documentInputApiClient.hardDeleteDocumentInput(documentInput._id);
      const documentInputApiResponse = await documentInputApiClient.getDocumentInputsByRoomId(roomId);
      const singleRoomMediaOverview = await roomApiClient.getSingleRoomMediaOverview({ roomId });
      setDocumentInputs(documentInputApiResponse.documentInputs);
      setRoomMediaContext(oldContext => ({ ...oldContext, singleRoomMediaOverview }));
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentInputDeleteClick = documentInput => {
    confirmDocumentInputDelete(
      t,
      formatDate(documentInput.createdOn),
      () => handleDeleteDocumentInput(documentInput)
    );
  };

  const renderDocumentInput = documentInput => {
    const url = routes.getDocumentInputUrl(documentInput._id);
    const userProfileUrl = routes.getUserProfileUrl(documentInput.createdBy._id);
    const commentsCount = Object.values(documentInput.sections).flatMap(sectionData => sectionData.comments).length;
    const usedBytes = roomMediaContext?.singleRoomMediaOverview.roomStorage.usedBytesPerDocumentInput[documentInput._id] || 0;

    return (
      <div key={documentInput._id} className="RoomDocumentInputs-input">
        <div className="RoomDocumentInputs-inputMetadata">
          <div className="RoomDocumentInputs-inputDate">
            {formatDate(documentInput.createdOn)}
          </div>
          <div className="RoomDocumentInputs-inputLinks">
            <a href={url} className="RoomDocumentInputs-inputLink">
              {documentInput.documentTitle}
            </a>
            <a href={userProfileUrl} className="RoomDocumentInputs-inputLink RoomDocumentInputs-inputLink--user">
              {documentInput.createdBy.displayName}
            </a>
          </div>
        </div>
        <div className="RoomDocumentInputs-actions">
          <Tooltip title={t('storageSpaceTooltip')}>
            <div className="RoomDocumentInputs-actionsStorage">
              {prettyBytes(usedBytes, { locale: uiLocale })}
            </div>
          </Tooltip>
          <Tooltip title={t('common:totalCommentsNumberTooltip')}>
            <div className="RoomDocumentInputs-commentsGroup">
              <CommentOutlined shape="square" size="large" />
              <div className="RoomDocumentInputs-commentsCount">{commentsCount}</div>
            </div>
          </Tooltip>
          <Tooltip title={t('common:delete')}>
            <Button
              type="text"
              size="small"
              icon={<DeleteIcon />}
              className="u-action-button u-danger-action-button"
              onClick={() => handleDocumentInputDeleteClick(documentInput)}
              />
          </Tooltip>
        </div>
      </div>
    );
  };

  const showEmptyState = !documentInputs.length;

  return (
    <div className="RoomDocumentInputs">
      <Spin spinning={isLoading || isSaving}>
        {!!showEmptyState && (
          <EmptyState
            icon={<InputsIcon />}
            title={t('emptyStateTitle')}
            subtitle={t('emptyStateSubtitle')}
            />
        )}
        {!showEmptyState && (
          <Fragment>
            <FilterInput
              className="RoomDocumentInputs-textFilter"
              value={filterText}
              onChange={handleFilterTextChange}
              />

            {!filteredDocumentInputs.length && (
              <EmptyState
                icon={<FilterIcon />}
                title={t('common:filterResultEmptyStateTitle')}
                subtitle={t('common:searchOrFilterResultEmptyStateSubtitle')}
                />
            )}

            {filteredDocumentInputs.map(renderDocumentInput)}
          </Fragment>
        )}
      </Spin>
    </div>
  );
}

RoomDocumentInputs.propTypes = {
  roomId: PropTypes.string.isRequired
};

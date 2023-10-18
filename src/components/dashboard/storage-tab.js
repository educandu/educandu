import by from 'thenby';
import PropTypes from 'prop-types';
import Spinner from '../spinner.js';
import prettyBytes from 'pretty-bytes';
import { Select, Tooltip } from 'antd';
import EmptyState from '../empty-state.js';
import Logger from '../../common/logger.js';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../locale-context.js';
import InputsIcon from '../icons/general/inputs-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import PrivateIcon from '../icons/general/private-icon.js';
import { FILES_VIEWER_DISPLAY } from '../../domain/constants.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import UploadButton from '../resource-selector/shared/upload-button.js';
import { allRoomMediaOverviewShape } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import RoomMediaUploadModal from '../resource-selector/room-media/room-media-upload-modal.js';
import RoomMediaFilesViewer from '../resource-selector/room-media/room-media-files-viewer.js';
import RoomMediaPreviewModal from '../resource-selector/room-media/room-media-preview-modal.js';

const logger = new Logger(import.meta.url);

const createUploadModalProps = ({ isOpen = false, files = [] }) => ({ isOpen, files });
const createPreviewModalProps = ({ isOpen = false, file = null }) => ({ isOpen, file });

function StorageTab({ allRoomMediaOverview, loading, onAllRoomMediaOverviewChange }) {
  const { t } = useTranslation('storageTab');

  const { uiLocale } = useLocale();
  const filesViewerApiRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const [uploadModalProps, setUploadModalProps] = useState(createUploadModalProps({}));
  const [previewModalProps, setPreviewModalProps] = useState(createPreviewModalProps({}));
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const roomMediaContext = useMemo(() => {
    if (!selectedRoomId || !allRoomMediaOverview) {
      return null;
    }

    const singleRoomMediaOverview = {
      storagePlan: allRoomMediaOverview.storagePlan,
      usedBytes: allRoomMediaOverview.usedBytes || 0,
      roomStorage: allRoomMediaOverview.roomStorageList.find(roomStorage => roomStorage.roomId === selectedRoomId)
    };

    return {
      singleRoomMediaOverview,
      isDeletionEnabled: true
    };
  }, [selectedRoomId, allRoomMediaOverview]);

  useEffect(() => {
    if (!allRoomMediaOverview) {
      setRoomOptions([]);
      setSelectedRoomId(null);
      return;
    }

    const newRoomOptions = allRoomMediaOverview.roomStorageList
      .map(roomStorage => ({ value: roomStorage.roomId, label: roomStorage.roomName }))
      .sort(by(option => option.label));

    setRoomOptions(newRoomOptions);
    setSelectedRoomId(oldSelectedRoomId => {
      return oldSelectedRoomId && newRoomOptions.some(option => option.value === oldSelectedRoomId)
        ? oldSelectedRoomId
        : newRoomOptions[0]?.value || null;
    });
  }, [allRoomMediaOverview]);

  useEffect(() => {
    const newFiles = allRoomMediaOverview?.roomStorageList.find(roomStorage => roomStorage.roomId === selectedRoomId)?.roomMediaItems || [];
    setFiles(newFiles);
    setHighlightedFile(oldFile => newFiles.find(file => file.url === oldFile?.url) || null);
  }, [selectedRoomId, allRoomMediaOverview]);

  const handleFileClick = newFile => {
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleFilesDropped = filesToUpload => {
    setUploadModalProps(createUploadModalProps({ files: filesToUpload, isOpen: true }));
  };

  const handleDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.name, async () => {
      try {
        setIsUpdating(true);
        await roomApiClient.deleteRoomMedia({ roomId: selectedRoomId, roomMediaItemId: file._id });
        const overview = await roomApiClient.getAllRoomMediaOverview();
        onAllRoomMediaOverviewChange(overview);
      } catch (error) {
        handleApiError({ error, logger, t });
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const handleFileDoubleClick = newHighlightedFile => {
    setHighlightedFile(newHighlightedFile);
    setPreviewModalProps(createPreviewModalProps({ isOpen: true, file: newHighlightedFile }));
  };

  const handlePreviewFileClick = () => {
    setPreviewModalProps(createPreviewModalProps({ isOpen: true, file: highlightedFile }));
  };

  const handlePreviewModalClose = () => {
    setPreviewModalProps(createPreviewModalProps({ isOpen: false }));
  };

  const handleUploadModalOk = async () => {
    setUploadModalProps(oldProps => ({ ...oldProps, isOpen: false }));
    try {
      setIsUpdating(true);
      const overview = await roomApiClient.getAllRoomMediaOverview();
      onAllRoomMediaOverviewChange(overview);
    } catch (error) {
      handleApiError({ error, logger, t });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadModalCancel = () => {
    setUploadModalProps(oldProps => ({ ...oldProps, isOpen: false }));
  };

  const handleUploadButtonClick = () => {
    filesViewerApiRef.current.open();
  };

  const renderRoomSelect = () => {
    const { usedBytesByDocumentInputMediaItems } = allRoomMediaOverview.roomStorageList.find(roomStorage => roomStorage.roomId === selectedRoomId);

    return (
      <div className="StorageTab-roomSelectContainer">
        <div className="StorageTab-roomSelectField">
          <span className="u-label">{t('common:room')}:</span>
          <Select
            options={roomOptions}
            value={selectedRoomId}
            onChange={setSelectedRoomId}
            dropdownMatchSelectWidth={false}
            className="StorageTab-roomSelect"
            />
        </div>
        <Tooltip title={t('roomSelectDetailsTooltip')}>
          <div className="StorageTab-roomSelectDetails">
            <InputsIcon />
            <div className="StorageTab-roomSelectDetailsText">
              {prettyBytes(usedBytesByDocumentInputMediaItems, { locale: uiLocale })}
            </div>
          </div>
        </Tooltip>
      </div>
    );
  };

  const showEmptyState = !allRoomMediaOverview?.storagePlan && !allRoomMediaOverview?.usedBytes;

  return (
    <div className="StorageTab">
      <RoomMediaContextProvider context={roomMediaContext}>
        {!loading && !!showEmptyState && (
          <EmptyState icon={<PrivateIcon />} title={t('emptyStateTitle')} subtitle={t('emptyStateSubtitle')} />
        )}

        <section className="StorageTab-content">
          {!!loading && <Spinner />}

          {!loading && !showEmptyState && (
            <Fragment>
              <div className="StorageTab-planName">
                {!allRoomMediaOverview?.storagePlan && t('noStoragePlan')}
                {!!allRoomMediaOverview?.storagePlan && (
                  <div>{t('storagePlanName')}: <b>{allRoomMediaOverview.storagePlan.name}</b></div>
                )}
              </div>
              <Fragment>
                <div className="StorageTab-usedStorage">
                  <UsedStorage usedBytes={allRoomMediaOverview.usedBytes} maxBytes={allRoomMediaOverview.storagePlan?.maxBytes} showLabel />
                </div>
                {!!selectedRoomId && (
                  <Fragment>
                    <div className="StorageTab-fileViewer">
                      <RoomMediaFilesViewer
                        canDelete
                        files={files}
                        customFilter={renderRoomSelect()}
                        isLoading={isUpdating}
                        apiRef={filesViewerApiRef}
                        highlightedFile={highlightedFile}
                        filesViewerDisplay={filesViewerDisplay}
                        onFileClick={handleFileClick}
                        onFilesDropped={handleFilesDropped}
                        onDeleteFileClick={handleDeleteFileClick}
                        onFileDoubleClick={handleFileDoubleClick}
                        onPreviewFileClick={handlePreviewFileClick}
                        onFilesViewerDisplayChange={setFilesViewerDisplay}
                        />
                    </div>
                    <div>
                      <UploadButton
                        disabled={loading || isUpdating || !allRoomMediaOverview?.storagePlan}
                        onClick={handleUploadButtonClick}
                        />
                    </div>
                  </Fragment>
                )}
              </Fragment>
            </Fragment>
          )}
        </section>
        <RoomMediaPreviewModal {...previewModalProps} onClose={handlePreviewModalClose} />
        <RoomMediaUploadModal {...uploadModalProps} onOk={handleUploadModalOk} onCancel={handleUploadModalCancel} />
      </RoomMediaContextProvider>
    </div>
  );
}

StorageTab.propTypes = {
  loading: PropTypes.bool,
  allRoomMediaOverview: allRoomMediaOverviewShape,
  onAllRoomMediaOverviewChange: PropTypes.func
};

StorageTab.defaultProps = {
  loading: false,
  allRoomMediaOverview: null,
  onAllRoomMediaOverviewChange: () => {}
};

export default StorageTab;

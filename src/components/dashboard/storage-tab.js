import by from 'thenby';
import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { Button, Select, Spin } from 'antd';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import UploadIcon from '../icons/general/upload-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import RoomApiClient from '../../api-clients/room-api-client.js';
import { FILES_VIEWER_DISPLAY } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { getRoomMediaRoomPath } from '../../utils/storage-utils.js';
import { RoomMediaContextProvider } from '../room-media-context.js';
import { roomMediaOverviewShape } from '../../ui/default-prop-types.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import RoomMediaUploadModal from '../resource-selector/room-media/room-media-upload-modal.js';
import RoomMediaFilesViewer from '../resource-selector/room-media/room-media-files-viewer.js';
import RoomMediaPreviewModal from '../resource-selector/room-media/room-media-preview-modal.js';

const logger = new Logger(import.meta.url);

const createUploadModalProps = ({ isOpen = false, files = [] }) => ({ isOpen, files });
const createPreviewModalProps = ({ isOpen = false, file = null }) => ({ isOpen, file });

function StorageTab({ roomMediaOverview, loading, onRoomMediaOverviewChange }) {
  const filesViewerApiRef = useRef(null);
  const [files, setFiles] = useState([]);
  const { t } = useTranslation('storageTab');
  const [roomOptions, setRoomOptions] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const [uploadModalProps, setUploadModalProps] = useState(createUploadModalProps({}));
  const [previewModalProps, setPreviewModalProps] = useState(createPreviewModalProps({}));
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const roomMediaContext = useMemo(() => {
    return selectedRoomId && roomMediaOverview
      ? {
        roomId: selectedRoomId,
        path: getRoomMediaRoomPath(selectedRoomId),
        usedBytes: roomMediaOverview.usedBytes || 0,
        maxBytes: roomMediaOverview.storagePlan?.maxBytes || 0,
        isDeletionEnabled: true
      }
      : null;
  }, [selectedRoomId, roomMediaOverview]);

  useEffect(() => {
    if (!roomMediaOverview) {
      setRoomOptions([]);
      setSelectedRoomId(null);
      return;
    }

    const newRoomOptions = roomMediaOverview.roomStorageList
      .map(roomStorage => ({ value: roomStorage.roomId, label: roomStorage.roomName }))
      .sort(by(option => option.label));

    setRoomOptions(newRoomOptions);
    setSelectedRoomId(oldSelectedRoomId => {
      return oldSelectedRoomId && newRoomOptions.some(option => option.value === oldSelectedRoomId)
        ? oldSelectedRoomId
        : newRoomOptions[0]?.value || null;
    });
  }, [roomMediaOverview]);

  useEffect(() => {
    const newFiles = roomMediaOverview?.roomStorageList.find(roomStorage => roomStorage.roomId === selectedRoomId)?.objects || [];
    setFiles(newFiles);
    setHighlightedFile(oldFile => newFiles.find(file => file.url === oldFile?.url) || null);
  }, [selectedRoomId, roomMediaOverview]);

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
        await roomApiClient.deleteRoomMedia({ roomId: selectedRoomId, name: file.name });
        const overview = await roomApiClient.getRoomMediaOverview();
        onRoomMediaOverviewChange(overview);
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
      const overview = await roomApiClient.getRoomMediaOverview();
      onRoomMediaOverviewChange(overview);
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

  const renderRoomSelect = () => (
    <div className="StorageTab-roomSelectContainer">
      <span className="u-label">{t('common:room')}:</span>
      <Select
        options={roomOptions}
        value={selectedRoomId}
        onChange={setSelectedRoomId}
        dropdownMatchSelectWidth={false}
        className="StorageTab-roomSelect"
        />
    </div>
  );

  return (
    <div className="StorageTab">
      <RoomMediaContextProvider context={roomMediaContext}>
        <div className="StorageTab-tabInfo">{t('info')}</div>
        <section className="StorageTab-content">
          {!!loading && <Spin className="u-spin" />}
          <div className="StorageTab-planName">
            {!loading && !roomMediaOverview?.storagePlan && t('noStoragePlan')}
            {!loading && !!roomMediaOverview?.storagePlan && (
              <div>{t('storagePlanName')}: <b>{roomMediaOverview.storagePlan.name}</b></div>
            )}
          </div>
          {!loading && !!(roomMediaOverview?.storagePlan || roomMediaOverview?.usedBytes) && (
            <Fragment>
              <div className="StorageTab-usedStorage">
                <UsedStorage usedBytes={roomMediaOverview.usedBytes} maxBytes={roomMediaOverview.storagePlan?.maxBytes} showLabel />
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
                    <Button
                      icon={<UploadIcon />}
                      disabled={loading || isUpdating || !roomMediaOverview?.storagePlan}
                      onClick={handleUploadButtonClick}
                      >
                      {t('common:uploadFiles')}
                    </Button>
                  </div>
                </Fragment>
              )}
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
  roomMediaOverview: roomMediaOverviewShape,
  onRoomMediaOverviewChange: PropTypes.func
};

StorageTab.defaultProps = {
  loading: false,
  roomMediaOverview: null,
  onRoomMediaOverviewChange: () => {}
};

export default StorageTab;

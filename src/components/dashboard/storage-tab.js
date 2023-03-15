import by from 'thenby';
import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { Button, Select, Spin } from 'antd';
import UsedStorage from '../used-storage.js';
import { useTranslation } from 'react-i18next';
import { StorageProvider } from '../storage-context.js';
import UploadIcon from '../icons/general/upload-icon.js';
import { handleApiError } from '../../ui/error-helper.js';
import { FILES_VIEWER_DISPLAY } from '../../domain/constants.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { getRoomMediaRoomPath } from '../../utils/storage-utils.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmMediaFileHardDelete } from '../confirmation-dialogs.js';
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import RoomMediaUploadModal from '../resource-selector/room-media/room-media-upload-modal.js';
import RoomMediaFilesViewer from '../resource-selector/room-media/room-media-files-viewer.js';
import RoomMediaPreviewModal from '../resource-selector/room-media/room-media-preview-modal.js';

const logger = new Logger(import.meta.url);

const createUploadModalProps = ({ isOpen = false, files = [] }) => ({ isOpen, files });
const createPreviewModalProps = ({ isOpen = false, file = null }) => ({ isOpen, file });

function StorageTab({ storage, loading, onStorageChange }) {
  const filesViewerApiRef = useRef(null);
  const [files, setFiles] = useState([]);
  const { t } = useTranslation('storageTab');
  const [roomOptions, setRoomOptions] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [uploadModalProps, setUploadModalProps] = useState(createUploadModalProps({}));
  const [previewModalProps, setPreviewModalProps] = useState(createPreviewModalProps({}));
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const storageProviderStorage = useMemo(() => ({
    usedBytes: storage?.usedBytes || 0,
    maxBytes: storage?.storagePlan?.maxBytes || 0,
    path: selectedRoomId ? getRoomMediaRoomPath(selectedRoomId) : 'invalid',
    isDeletionEnabled: true
  }), [storage, selectedRoomId]);

  useEffect(() => {
    if (!storage) {
      setRoomOptions([]);
      setSelectedRoomId(null);
      return;
    }

    const newRoomOptions = storage.rooms
      .map(room => ({ value: room.roomId, label: room.roomName }))
      .sort(by(option => option.label));

    setRoomOptions(newRoomOptions);
    setSelectedRoomId(oldSelectedRoomId => {
      return oldSelectedRoomId && newRoomOptions.some(option => option.value === oldSelectedRoomId)
        ? oldSelectedRoomId
        : newRoomOptions[0]?.value || null;
    });
  }, [storage]);

  useEffect(() => {
    const newFiles = storage?.rooms.find(room => room.roomId === selectedRoomId)?.objects || [];
    setFiles(newFiles);
    setHighlightedFile(oldFile => newFiles.find(file => file.url === oldFile?.url) || null);
  }, [selectedRoomId, storage]);

  const handleFileClick = newFile => {
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleFilesDropped = filesToUpload => {
    setUploadModalProps(createUploadModalProps({ files: filesToUpload, isOpen: true }));
  };

  const handleDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.displayName, async () => {
      try {
        setIsUpdating(true);
        await storageApiClient.deleteRoomMedia({ roomId: selectedRoomId, name: file.displayName });
        const newOverview = await storageApiClient.getRoomMediaOverview();
        onStorageChange(newOverview);
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
      const newOverview = await storageApiClient.getRoomMediaOverview();
      onStorageChange(newOverview);
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
      <StorageProvider value={storageProviderStorage}>
        <div className="StorageTab-tabInfo">{t('info')}</div>
        <section className="StorageTab-content">
          {!storage?.storagePlan && !!loading && <Spin className="u-spin" />}
          {!storage?.storagePlan && !loading && t('noStoragePlan')}
          {!!storage?.storagePlan && (
            <Fragment>
              <div className="StorageTab-planName">
                {t('storagePlanName')}: <b>{storage.storagePlan.name}</b>
              </div>
              <div className="StorageTab-usedStorage">
                <UsedStorage usedBytes={storage.usedBytes} maxBytes={storage.storagePlan.maxBytes} showLabel />
              </div>
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
                <Button onClick={handleUploadButtonClick} icon={<UploadIcon />} disabled={loading || isUpdating}>
                  {t('common:uploadFiles')}
                </Button>
              </div>
            </Fragment>
          )}
        </section>
        <RoomMediaPreviewModal {...previewModalProps} onClose={handlePreviewModalClose} />
        <RoomMediaUploadModal {...uploadModalProps} onOk={handleUploadModalOk} onCancel={handleUploadModalCancel} />
      </StorageProvider>
    </div>
  );
}

StorageTab.propTypes = {
  storage: PropTypes.object,
  loading: PropTypes.bool,
  onStorageChange: PropTypes.func
};

StorageTab.defaultProps = {
  storage: null,
  loading: false,
  onStorageChange: () => {}
};

export default StorageTab;

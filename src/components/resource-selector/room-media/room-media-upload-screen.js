import Info from '../../info.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import { Button, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import UsedStorage from '../../used-storage.js';
import { useLocale } from '../../locale-context.js';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { FILE_UPLOAD_STATUS } from '../shared/constants.js';
import { replaceItemAt } from '../../../utils/array-utils.js';
import React, { useCallback, useEffect, useState } from 'react';
import FilesUploadViewer from '../shared/files-upload-viewer.js';
import RoomApiClient from '../../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import { STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES } from '../../../domain/constants.js';
import { useRoomMediaContext, useSetRoomMediaContext } from '../../room-media-context.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../../../utils/storage-utils.js';

const STAGE = {
  uploadNotStarted: 'uploadNotStarted',
  uploading: 'uploading',
  uploadFinished: 'uploadFinished'
};

const createUploadItems = uploadQueue => uploadQueue.map(({ file, isPristine }) => ({
  file,
  status: isPristine ? FILE_UPLOAD_STATUS.pristine : FILE_UPLOAD_STATUS.processed,
  isEditable: isEditableImageFile(file),
  errorMessage: null
}));

function RoomMediaUploadScreen({
  canGoBack,
  uploadQueue,
  canSelectFilesAfterUpload,
  onOkClick,
  onBackClick,
  onCancelClick,
  onEditFileClick,
  onSelectFileClick
}) {
  const { uiLocale } = useLocale();
  const roomMediaContext = useRoomMediaContext();
  const setRoomMediaContext = useSetRoomMediaContext();
  const { t } = useTranslation('roomMediaUploadScreen');

  const [optimizeImages, setOptimizeImages] = useState(true);
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);
  const [previewedItemIndex, setPreviewedItemIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState(STAGE.uploadNotStarted);
  const [uploadItems, setUploadItems] = useState(createUploadItems(uploadQueue));

  const roomId = roomMediaContext?.singleRoomMediaOverview.roomStorage.roomId || null;

  useEffect(() => {
    setOptimizeImages(true);
    setPreviewedItemIndex(0);
    setCurrentStage(STAGE.uploadNotStarted);
    setUploadItems(createUploadItems(uploadQueue));
  }, [uploadQueue]);

  const ensureCanUpload = useCallback(file => {
    if (file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES) {
      throw new Error(t('uploadLimitExceeded', {
        uploadSize: prettyBytes(file.size, { locale: uiLocale }),
        uploadLimit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES, { locale: uiLocale })
      }));
    }

    const maxBytes = roomMediaContext?.singleRoomMediaOverview.storagePlan?.maxBytes || 0;
    const usedBytes = roomMediaContext?.singleRoomMediaOverview.usedBytes.usedBytes || 0;
    const availableBytes = Math.max(0, maxBytes - usedBytes);

    if (file.size > availableBytes) {
      throw new Error(t('insufficientPrivateStorge'));
    }
  }, [t, uiLocale, roomMediaContext]);

  const uploadFiles = useCallback(async itemsToUpload => {
    const processedFiles = await processFilesBeforeUpload({ files: itemsToUpload.map(item => item.file), optimizeImages });

    for (let i = 0; i < processedFiles.length; i += 1) {
      const file = processedFiles[i];
      const currentItem = itemsToUpload[i];

      setUploadItems(prevItems => replaceItemAt(prevItems, { ...currentItem, status: FILE_UPLOAD_STATUS.uploading }, i));

      let updatedItem;
      try {
        ensureCanUpload(file);
        const { storagePlan, usedBytes, roomStorage, createdRoomMediaItemId } = await roomApiClient.postRoomMedia({ roomId, file });
        updatedItem = {
          ...currentItem,
          status: FILE_UPLOAD_STATUS.succeeded,
          uploadedFile: roomStorage.roomMediaItems.find(item => item._id === createdRoomMediaItemId) || null
        };

        setRoomMediaContext(oldContext => (
          {
            ...oldContext,
            singleRoomMediaOverview: {
              storagePlan,
              usedBytes,
              roomStorage
            }
          }
        ));
      } catch (error) {
        updatedItem = {
          ...currentItem,
          status: FILE_UPLOAD_STATUS.failed,
          errorMessage: error.message
        };
      }

      setUploadItems(prevItems => replaceItemAt(prevItems, updatedItem, i));
    }
  }, [roomId, roomApiClient, ensureCanUpload, setRoomMediaContext, optimizeImages]);

  const handleStartUploadClick = async () => {
    setCurrentStage(STAGE.uploading);
    await uploadFiles(uploadItems);
    setCurrentStage(STAGE.uploadFinished);
  };

  const handleEditItemClick = itemIndex => {
    onEditFileClick(itemIndex);
  };

  const handleItemClick = itemIndex => {
    setPreviewedItemIndex(itemIndex);
  };

  const handleImageOptimizationChange = event => {
    const { checked } = event.target;
    setOptimizeImages(checked);
  };

  const handleSelectPreviewedFileClick = () => {
    onSelectFileClick(uploadItems[previewedItemIndex].uploadedFile);
  };

  const getUploadStageHeadline = () => {
    switch (currentStage) {
      case STAGE.uploadNotStarted:
        return t('stage_uploadNotStarted', { fileCount: uploadItems.length });
      case STAGE.uploading:
        return t('stage_uploading');
      case STAGE.uploadFinished:
        return t('stage_uploadFinished');
      default:
        throw new Error(`Invalid stage value: ${currentStage}`);
    }
  };

  const renderUploadStageHeadline = () => {
    const renderInfo = uploadItems.some(item => item.isEditable);

    return (
      <div className="RoomMediaUploadScreen-uploadStageHeadline">
        {getUploadStageHeadline()}
        {!!renderInfo && (
          <div className={classNames('RoomMediaUploadScreen-uploadStageHeadlineInfo', { 'is-visible': currentStage === STAGE.uploadNotStarted })}>
            <Info>{t('stageDetails_uploadNotStarted')}</Info>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="u-resource-selector-screen">
      <h3 className="u-resource-selector-screen-headline">{t('headline')}</h3>
      <div className="u-resource-selector-screen-content">
        <div className="RoomMediaUploadScreen">
          {!!roomMediaContext && (
            <div className="RoomMediaUploadScreen-usedStorage" >
              <UsedStorage
                usedBytes={roomMediaContext.singleRoomMediaOverview.usedBytes}
                maxBytes={roomMediaContext.singleRoomMediaOverview.storagePlan?.maxBytes || 0}
                showLabel
                />
            </div>
          )}
          {renderUploadStageHeadline()}
          <FilesUploadViewer
            uploadItems={uploadItems}
            previewedItemIndex={previewedItemIndex}
            onEditItemClick={handleEditItemClick}
            onItemClick={handleItemClick}
            editingDisabled={currentStage !== STAGE.uploadNotStarted}
            />
        </div>
      </div>
      <div>
        <div className="RoomMediaUploadScreen-imageOptimizationCheckbox">
          {currentStage !== STAGE.uploadFinished && (
            <Checkbox
              checked={optimizeImages}
              onChange={handleImageOptimizationChange}
              disabled={currentStage === STAGE.uploading}
              >
              {t('optimizeImages')}
            </Checkbox>
          )}
        </div>
        <div className={canGoBack ? 'u-resource-selector-screen-footer' : 'u-resource-selector-screen-footer-right-aligned'}>
          {!!canGoBack && (
          <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={currentStage === STAGE.uploading}>{t('common:back')}</Button>
          )}
          <div className="u-resource-selector-screen-footer-buttons">
            {(currentStage !== STAGE.uploadFinished || !!canSelectFilesAfterUpload) && (
            <Button
              onClick={onCancelClick}
              disabled={currentStage === STAGE.uploading}
              >{t('common:cancel')}
            </Button>
            )}
            {(currentStage === STAGE.uploadNotStarted || currentStage === STAGE.uploading) && (
            <Button
              type="primary"
              onClick={handleStartUploadClick}
              loading={currentStage === STAGE.uploading}
              >{t('startUpload')}
            </Button>
            )}
            {currentStage === STAGE.uploadFinished && !!canSelectFilesAfterUpload && (
            <Button
              type="primary"
              onClick={handleSelectPreviewedFileClick}
              disabled={uploadItems[previewedItemIndex]?.status !== FILE_UPLOAD_STATUS.succeeded}
              >{t('common:select')}
            </Button>
            )}
            {currentStage === STAGE.uploadFinished && !canSelectFilesAfterUpload && (
            <Button type="primary" onClick={onOkClick}>{t('common:ok')}</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

RoomMediaUploadScreen.propTypes = {
  canGoBack: PropTypes.bool,
  canSelectFilesAfterUpload: PropTypes.bool,
  uploadQueue: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    isPristine: PropTypes.bool.isRequired
  })).isRequired,
  onOkClick: PropTypes.func,
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onEditFileClick: PropTypes.func,
  onSelectFileClick: PropTypes.func
};

RoomMediaUploadScreen.defaultProps = {
  canGoBack: true,
  canSelectFilesAfterUpload: true,
  onOkClick: () => {},
  onBackClick: () => {},
  onCancelClick: () => {},
  onEditFileClick: () => {},
  onSelectFileClick: () => {}
};

export default RoomMediaUploadScreen;

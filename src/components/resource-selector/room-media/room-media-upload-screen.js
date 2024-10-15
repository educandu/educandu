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

const mapToUploadItem = (t, uiLocale, file, isPristine) => {
  const fileIsTooBig = file.size > STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES;
  const errorMessage = fileIsTooBig
    ? t('common:fileIsTooBig', { limit: prettyBytes(STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES, { locale: uiLocale }) })
    : null;

  const processedStatus = isPristine ? FILE_UPLOAD_STATUS.pristine : FILE_UPLOAD_STATUS.processed;

  return {
    file,
    status: errorMessage ? FILE_UPLOAD_STATUS.failed : processedStatus,
    isEditable: isEditableImageFile(file),
    errorMessage
  };
};

const mapToUploadItems = (t, uiLocale, uploadQueue) => {
  return uploadQueue.map(({ file, isPristine }) => mapToUploadItem(t, uiLocale, file, isPristine));
};

function RoomMediaUploadScreen({
  canGoBack,
  uploadQueue,
  previewedFileIndex,
  canSelectFilesAfterUpload,
  onOkClick,
  onBackClick,
  onCancelClick,
  onSelectUrl,
  onFileClick,
  onEditFileClick
}) {
  const { uiLocale } = useLocale();
  const roomMediaContext = useRoomMediaContext();
  const setRoomMediaContext = useSetRoomMediaContext();
  const { t } = useTranslation('roomMediaUploadScreen');
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [optimizeImages, setOptimizeImages] = useState(true);
  const [currentStage, setCurrentStage] = useState(STAGE.uploadNotStarted);
  const [uploadItems, setUploadItems] = useState(mapToUploadItems(t, uiLocale, uploadQueue));

  const roomId = roomMediaContext?.singleRoomMediaOverview.roomStorage.roomId || null;

  useEffect(() => {
    setOptimizeImages(true);
    setCurrentStage(STAGE.uploadNotStarted);
    setUploadItems(mapToUploadItems(t, uiLocale, uploadQueue));
  }, [uploadQueue, t, uiLocale]);

  const ensureCanUpload = useCallback(file => {
    const maxBytes = roomMediaContext?.singleRoomMediaOverview.storagePlan?.maxBytes || 0;
    const usedBytes = roomMediaContext?.singleRoomMediaOverview.usedBytes || 0;
    const availableBytes = Math.max(0, maxBytes - usedBytes);

    if (file.size > availableBytes) {
      throw new Error(t('insufficientPrivateStorge'));
    }
  }, [t, roomMediaContext]);

  const uploadFiles = useCallback(async itemsToUpload => {
    if (!itemsToUpload.length) {
      return;
    }

    const processedFiles = await processFilesBeforeUpload({ files: itemsToUpload.map(item => item.file), optimizeImages });

    for (let i = 0; i < processedFiles.length; i += 1) {
      const file = processedFiles[i];
      const currentItem = { ...itemsToUpload[i], file, status: FILE_UPLOAD_STATUS.uploading };

      setUploadItems(prevItems => replaceItemAt(prevItems, currentItem, i));

      let updatedItem;
      try {
        ensureCanUpload(file);
        const { storagePlan, usedBytes, roomStorage, createdRoomMediaItemId } = await roomApiClient.postRoomMedia({ roomId, file });

        updatedItem = {
          ...currentItem,
          status: FILE_UPLOAD_STATUS.succeeded,
          createdRoomMediaItem: roomStorage.roomMediaItems.find(item => item._id === createdRoomMediaItemId) || null
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
    const itemsToUpload = uploadItems.filter(item => !item.errorMessage);
    setUploadItems(itemsToUpload);
    await uploadFiles(itemsToUpload);
    setCurrentStage(STAGE.uploadFinished);
  };

  const handleUploadViewerEditItemClick = itemIndex => {
    onEditFileClick(itemIndex);
  };

  const handleUploadViewerItemClick = itemIndex => {
    onFileClick(itemIndex);
  };

  const handleImageOptimizationChange = event => {
    const { checked } = event.target;
    setOptimizeImages(checked);
  };

  const handleSelectButtonClick = () => {
    onSelectUrl(uploadItems[previewedFileIndex].createdRoomMediaItem.portableUrl);
  };

  const getUploadStageHeadline = () => {
    switch (currentStage) {
      case STAGE.uploadNotStarted:
        return t('common:mediaFilesSelectedForUpload', { fileCount: uploadItems.length });
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
            items={uploadItems}
            previewedItemIndex={previewedFileIndex}
            canEdit={currentStage === STAGE.uploadNotStarted}
            onEditItemClick={handleUploadViewerEditItemClick}
            onItemClick={handleUploadViewerItemClick}
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
              {t('common:optimizeImages')}
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
              disabled={uploadItems.every(item => !!item.errorMessage)}
              loading={currentStage === STAGE.uploading}
              >{t('startUpload')}
            </Button>
            )}
            {currentStage === STAGE.uploadFinished && !!canSelectFilesAfterUpload && (
            <Button
              type="primary"
              onClick={handleSelectButtonClick}
              disabled={uploadItems[previewedFileIndex]?.status !== FILE_UPLOAD_STATUS.succeeded}
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
  previewedFileIndex: PropTypes.number.isRequired,
  onOkClick: PropTypes.func,
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onSelectUrl: PropTypes.func,
  onFileClick: PropTypes.func,
  onEditFileClick: PropTypes.func
};

RoomMediaUploadScreen.defaultProps = {
  canGoBack: true,
  canSelectFilesAfterUpload: true,
  onOkClick: () => {},
  onBackClick: () => {},
  onCancelClick: () => {},
  onSelectUrl: () => {},
  onFileClick: () => {},
  onEditFileClick: () => {}
};

export default RoomMediaUploadScreen;

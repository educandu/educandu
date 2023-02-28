import Info from '../../info.js';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import UsedStorage from '../../used-storage.js';
import { Button, Checkbox, Tooltip } from 'antd';
import { useLocale } from '../../locale-context.js';
import cloneDeep from '../../../utils/clone-deep.js';
import EditIcon from '../../icons/general/edit-icon.js';
import FileIcon from '../../icons/general/file-icon.js';
import ResourceDetails from '../shared/resource-details.js';
import { replaceItemAt } from '../../../utils/array-utils.js';
import { useSetStorageLocation } from '../../storage-context.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import { storageLocationShape } from '../../../ui/default-prop-types.js';
import StorageApiClient from '../../../api-clients/storage-api-client.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../../../utils/storage-utils.js';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../../../domain/constants.js';

const ITEM_STATUS = {
  pristine: 'pristine',
  preprocessed: 'preprocessed',
  uploading: 'uploading',
  succeeded: 'succeeded',
  failed: 'failed'
};

const STAGE = {
  uploadNotStarted: 'uploadNotStarted',
  uploading: 'uploading',
  uploadFinished: 'uploadFinished'
};

function RoomMediaUploadScreen({
  uploadQueue,
  storageLocation,
  onBackClick,
  onCancelClick,
  onEditFileClick,
  onSelectFileClick
}) {
  const { uiLocale } = useLocale();
  const setStorageLocation = useSetStorageLocation();
  const { t } = useTranslation('roomMediaUploadScreen');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [optimizeImages, setOptimizeImages] = useState(true);
  const [previewedFileIndex, setPreviewedFileIndex] = useState(-1);
  const [currentStage, setCurrentStage] = useState(STAGE.uploadNotStarted);
  const [uploadItems, setUploadItems] = useState(uploadQueue.map(({ file, isPristine }) => ({
    file,
    status: isPristine ? ITEM_STATUS.pristine : ITEM_STATUS.preprocessed,
    isEditable: isEditableImageFile(file),
    errorMessage: null
  })));

  useEffect(() => {
    if (uploadItems.length === 1 && uploadItems[0].status === ITEM_STATUS.succeeded) {
      setPreviewedFileIndex(0);
    }
  }, [uploadItems]);

  const ensureCanUpload = useCallback((file, locationToUpload) => {
    if (file.size > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES) {
      throw new Error(t('uploadLimitExceeded', {
        uploadSize: prettyBytes(file.size, { locale: uiLocale }),
        uploadLimit: prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, { locale: uiLocale })
      }));
    }

    if (locationToUpload.type === STORAGE_LOCATION_TYPE.roomMedia) {
      const availableBytes = Math.max(0, (locationToUpload.maxBytes || 0) - (locationToUpload.usedBytes || 0));
      if (file.size > availableBytes) {
        throw new Error(t('insufficientPrivateStorge'));
      }
    }
  }, [t, uiLocale]);

  const uploadFiles = useCallback(async (itemsToUpload, uploadLocation) => {
    let currentLocation = uploadLocation;

    const result = {
      uploadedFiles: {},
      failedFiles: {}
    };

    const processedFiles = await processFilesBeforeUpload({ files: itemsToUpload.map(item => item.file), optimizeImages });

    for (let i = 0; i < processedFiles.length; i += 1) {
      const file = processedFiles[i];
      const currentItem = itemsToUpload[i];

      setUploadItems(prevItems => replaceItemAt(prevItems, { ...currentItem, status: ITEM_STATUS.uploading }, i));

      let updatedItem;
      try {
        ensureCanUpload(file, uploadLocation);
        const { uploadedFiles, usedBytes } = await storageApiClient.uploadFiles([file], uploadLocation.path);
        result.uploadedFiles = { ...result.uploadedFiles, ...uploadedFiles };
        updatedItem = {
          ...currentItem,
          status: ITEM_STATUS.succeeded,
          uploadedFile: Object.values(uploadedFiles)[0]
        };
        currentLocation = { ...cloneDeep(currentLocation), usedBytes };
        setStorageLocation(currentLocation);
      } catch (error) {
        result.failedFiles = { ...result.failedFiles, [file.name]: file };
        updatedItem = {
          ...currentItem,
          status: ITEM_STATUS.failed,
          errorMessage: error.message
        };
      }

      setUploadItems(prevItems => replaceItemAt(prevItems, updatedItem, i));
    }

    return result;

  }, [storageApiClient, ensureCanUpload, setStorageLocation, optimizeImages]);

  const handleStartUploadClick = async () => {
    setCurrentStage(STAGE.uploading);
    await uploadFiles(uploadItems, storageLocation);
    setCurrentStage(STAGE.uploadFinished);
  };

  const handleItemEditClick = itemIndex => {
    onEditFileClick(itemIndex);
  };

  const handleImageOptimizationChange = event => {
    const { checked } = event.target;
    setOptimizeImages(checked);
  };

  const handleSelectPreviewedFileClick = () => {
    onSelectFileClick(uploadItems[previewedFileIndex].uploadedFile);
  };

  const handleUploadItemClick = itemIndex => {
    setPreviewedFileIndex(itemIndex === previewedFileIndex ? -1 : itemIndex);
  };

  const getUploadMessage = () => {
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

  const renderUploadMessage = () => {
    const shouldRenderMessageDetails = currentStage === STAGE.uploadNotStarted && uploadItems.some(item => item.isEditable);

    return (
      <div className="RoomMediaUploadScreen-message">
        {getUploadMessage()}
        {!!shouldRenderMessageDetails && (
          <div className="RoomMediaUploadScreen-messageDetails">
            <Info>{t('stageDetails_uploadNotStarted')}</Info>
          </div>
        )}
      </div>
    );
  };

  const renderUploadItemName = (item, itemIndex) => {
    if (item.status === ITEM_STATUS.succeeded && uploadItems.length > 1) {
      return <a onClick={() => handleUploadItemClick(itemIndex)}>{item.file.name}</a>;
    }
    return item.file.name;
  };

  const renderUploadItem = (item, itemIndex) => {
    return (
      <div className="RoomMediaUploadScreen-fileStatus">
        <div className="RoomMediaUploadScreen-fileStatusRow">
          {item.status === ITEM_STATUS.pristine && !!item.isEditable && (
          <Tooltip title={t('common:edit')}>
            <a onClick={() => handleItemEditClick(itemIndex)} disabled={currentStage !== STAGE.uploadNotStarted}>
              <EditIcon className="RoomMediaUploadScreen-fileStatusIcon RoomMediaUploadScreen-fileStatusIcon--pristine" />
            </a>
          </Tooltip>
          )}
          {item.status === ITEM_STATUS.pristine && !item.isEditable && (
          <FileIcon className="RoomMediaUploadScreen-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.preprocessed && !!item.isEditable && (
          <Tooltip title={t('common:edit')}>
            <a onClick={() => handleItemEditClick(itemIndex)}>
              <EditIcon className="RoomMediaUploadScreen-fileStatusIcon RoomMediaUploadScreen-fileStatusIcon--processed" />
            </a>
          </Tooltip>
          )}
          {item.status === ITEM_STATUS.preprocessed && !item.isEditable && (
            <FileIcon className="RoomMediaUploadScreen-fileStatusIcon RoomMediaUploadScreen-fileStatusIcon--processed" />
          )}
          {item.status === ITEM_STATUS.uploading && (
          <LoadingOutlined className="RoomMediaUploadScreen-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.succeeded && (
          <CheckOutlined className="RoomMediaUploadScreen-fileStatusIcon RoomMediaUploadScreen-fileStatusIcon--success" />
          )}
          {item.status === ITEM_STATUS.failed && (
          <CloseOutlined className="RoomMediaUploadScreen-fileStatusIcon RoomMediaUploadScreen-fileStatusIcon--error" />
          )}
          {renderUploadItemName(item, itemIndex)}
          {item.status === ITEM_STATUS.preprocessed && (
          <span className="RoomMediaUploadScreen-fileStatusMessage">({t('preprocessed')})</span>
          )}
        </div>
        {!!item.errorMessage && <div className="RoomMediaUploadScreen-fileStatusError">{item.errorMessage}</div>}
        {previewedFileIndex === itemIndex && (
          <div className="RoomMediaUploadScreen-fileStatusPreview">
            <ResourceDetails url={item.uploadedFile.url} size={item.uploadedFile.size} previewOnly />
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
          {storageLocation.type === STORAGE_LOCATION_TYPE.roomMedia && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0) && (
            <div className="RoomMediaUploadScreen-usedStorage" >
              <UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />
            </div>
          )}
          {renderUploadMessage()}
          <div className="RoomMediaUploadScreen-fileStatusContainer">
            {uploadItems.map((item, index) => (
              <div key={index.toString()}>
                {renderUploadItem(item, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
      {currentStage !== STAGE.uploadFinished && (
        <Checkbox
          checked={optimizeImages}
          onChange={handleImageOptimizationChange}
          disabled={currentStage === STAGE.uploading}
          className="RoomMediaUploadScreen-imageOptimizationCheckbox"
          >
          {t('optimizeImages')}
        </Checkbox>
      )}
      <div className="u-resource-selector-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={currentStage === STAGE.uploading}>{t('common:back')}</Button>
        <div className="u-resource-selector-screen-footer-buttons">
          <Button onClick={onCancelClick} disabled={currentStage === STAGE.uploading}>{t('common:cancel')}</Button>
          {(currentStage === STAGE.uploadNotStarted || currentStage === STAGE.uploading) && (
            <Button type="primary" onClick={handleStartUploadClick} loading={currentStage === STAGE.uploading}>{t('startUpload')}</Button>
          )}
          {currentStage === STAGE.uploadFinished && (
            <Button type="primary" onClick={handleSelectPreviewedFileClick} disabled={previewedFileIndex === -1}>{t('common:select')}</Button>
          )}
        </div>
      </div>
    </div>
  );
}

RoomMediaUploadScreen.propTypes = {
  onBackClick: PropTypes.func,
  onCancelClick: PropTypes.func,
  onEditFileClick: PropTypes.func,
  onSelectFileClick: PropTypes.func,
  storageLocation: storageLocationShape.isRequired,
  uploadQueue: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    isPristine: PropTypes.bool.isRequired
  })).isRequired
};

RoomMediaUploadScreen.defaultProps = {
  onBackClick: () => {},
  onCancelClick: () => {},
  onEditFileClick: () => {},
  onSelectFileClick: () => {}
};

export default RoomMediaUploadScreen;
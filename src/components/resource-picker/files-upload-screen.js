import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import UsedStorage from '../used-storage.js';
import FilePreview from '../file-preview.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { useLocale } from '../locale-context.js';
import { Button, Checkbox, Tooltip } from 'antd';
import EditIcon from '../icons/general/edit-icon.js';
import FileIcon from '../icons/general/file-icon.js';
import { replaceItemAt } from '../../utils/array-utils.js';
import { useSetStorageLocation } from '../storage-context.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { cdnObjectShape, storageLocationShape } from '../../ui/default-prop-types.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../../utils/storage-utils.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';

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

function FilesUploadScreen({
  uploadQueue,
  directory,
  storageLocation,
  onBackClick,
  onCancelClick,
  onEditFileClick,
  onSelectFileClick
}) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('filesUploadScreen');
  const setStorageLocation = useSetStorageLocation();
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

    if (locationToUpload.type === STORAGE_LOCATION_TYPE.private) {
      const availableBytes = Math.max(0, (locationToUpload.maxBytes || 0) - (locationToUpload.usedBytes || 0));
      if (file.size > availableBytes) {
        throw new Error(t('insufficientPrivateStorge'));
      }
    }
  }, [t, uiLocale]);

  const uploadFiles = useCallback(async (itemsToUpload, locationToUpload, targetDirectory) => {
    let currentLocation = locationToUpload;

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
        ensureCanUpload(file, locationToUpload);

        // eslint-disable-next-line no-await-in-loop
        const { uploadedFiles, usedBytes } = await storageApiClient.uploadFiles([file], targetDirectory.path);
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
    await uploadFiles(uploadItems, storageLocation, directory);
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
      <div className="FilesUploadScreen-message">
        {getUploadMessage()}
        {shouldRenderMessageDetails && (
          <div className="FilesUploadScreen-messageDetails">
            <InfoCircleOutlined className="u-info-icon FilesUploadScreen-messageDetailsIcon" />
            {t('stageDetails_uploadNotStarted')}
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
      <div className="FilesUploadScreen-fileStatus">
        <div className="FilesUploadScreen-fileStatusRow">
          {item.status === ITEM_STATUS.pristine && item.isEditable && (
          <Tooltip title={t('common:edit')}>
            <a onClick={() => handleItemEditClick(itemIndex)} disabled={currentStage !== STAGE.uploadNotStarted}>
              <EditIcon className="FilesUploadScreen-fileStatusIcon FilesUploadScreen-fileStatusIcon--pristine" />
            </a>
          </Tooltip>
          )}
          {item.status === ITEM_STATUS.pristine && !item.isEditable && (
          <FileIcon className="FilesUploadScreen-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.preprocessed && item.isEditable && (
          <Tooltip title={t('common:edit')}>
            <a onClick={() => handleItemEditClick(itemIndex)}>
              <EditIcon className="FilesUploadScreen-fileStatusIcon FilesUploadScreen-fileStatusIcon--processed" />
            </a>
          </Tooltip>
          )}
          {item.status === ITEM_STATUS.preprocessed && !item.isEditable && (
            <FileIcon className="FilesUploadScreen-fileStatusIcon FilesUploadScreen-fileStatusIcon--processed" />
          )}
          {item.status === ITEM_STATUS.uploading && (
          <LoadingOutlined className="FilesUploadScreen-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.succeeded && (
          <CheckOutlined className="FilesUploadScreen-fileStatusIcon FilesUploadScreen-fileStatusIcon--success" />
          )}
          {item.status === ITEM_STATUS.failed && (
          <CloseOutlined className="FilesUploadScreen-fileStatusIcon FilesUploadScreen-fileStatusIcon--error" />
          )}
          {renderUploadItemName(item, itemIndex)}
          {item.status === ITEM_STATUS.preprocessed && (
          <span className="FilesUploadScreen-fileStatusMessage">({t('preprocessed')})</span>
          )}
        </div>
        {item.errorMessage && <div className="FilesUploadScreen-fileStatusError">{item.errorMessage}</div>}
        {previewedFileIndex === itemIndex && (
        <div className="FilesUploadScreen-fileStatusPreview">
          <FilePreview
            url={item.uploadedFile.url}
            size={item.uploadedFile.size}
            createdOn={item.uploadedFile.createdOn}
            compact
            />
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="u-resource-picker-screen">
      <h3>{t('headline')}</h3>
      <div className="u-resource-picker-screen-content">
        <div className="FilesUploadScreen">
          {storageLocation.type === STORAGE_LOCATION_TYPE.private && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0) && (
            <div className="FilesUploadScreen-usedStorage" >
              <UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />
            </div>
          )}
          {renderUploadMessage()}
          <div className="FilesUploadScreen-fileStatusContainer">
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
          className="FilesUploadScreen-imageOptimizationCheckbox"
          >
          {t('optimizeImages')}
        </Checkbox>
      )}
      <div className="u-resource-picker-screen-footer">
        <Button onClick={onBackClick} icon={<ArrowLeftOutlined />} disabled={currentStage === STAGE.uploading}>{t('common:back')}</Button>
        <div className="u-resource-picker-screen-footer-buttons">
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

FilesUploadScreen.propTypes = {
  directory: cdnObjectShape.isRequired,
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

FilesUploadScreen.defaultProps = {
  onBackClick: () => {},
  onCancelClick: () => {},
  onEditFileClick: () => {},
  onSelectFileClick: () => {}
};

export default FilesUploadScreen;

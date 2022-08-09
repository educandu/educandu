import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { Button, Tooltip } from 'antd';
import UsedStorage from './used-storage.js';
import FilePreview from './file-preview.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useLocale } from './locale-context.js';
import React, { useCallback, useState } from 'react';
import { replaceItemAt } from '../utils/array-utils.js';
import { useSetStorageLocation } from './storage-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import { cdnObjectShape, storageLocationShape } from '../ui/default-prop-types.js';
import { isEditableImageFile, processFilesBeforeUpload } from '../utils/storage-utils.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { CheckOutlined, CloseOutlined, EditOutlined, FileOutlined, LoadingOutlined } from '@ant-design/icons';

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

function FilesUploadOverview({ uploadQueue, directory, storageLocation, showPreviewAfterUpload, onFileEdit, onUploadFinish }) {
  const { uiLocale } = useLocale();
  const setStorageLocation = useSetStorageLocation();
  const { t } = useTranslation('filesUploadOverview');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [currentStage, setCurrentStage] = useState(STAGE.uploadNotStarted);
  const [uploadItems, setUploadItems] = useState(uploadQueue.map(({ file, isPristine }) => ({
    file,
    status: isPristine ? ITEM_STATUS.pristine : ITEM_STATUS.preprocessed,
    uploadedFile: null,
    errorMessage: null
  })));

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

    const processedFiles = await processFilesBeforeUpload(itemsToUpload.map(item => item.file));

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

  }, [storageApiClient, ensureCanUpload, setStorageLocation]);

  const handleStartUploadClick = async () => {
    setCurrentStage(STAGE.uploading);
    const result = await uploadFiles(uploadItems, storageLocation, directory);
    setCurrentStage(STAGE.uploadFinished);
    onUploadFinish(result);
  };

  const handleItemEditClick = itemIndex => {
    onFileEdit(itemIndex);
  };

  const renderUploadMessage = () => {
    switch (currentStage) {
      case STAGE.uploadNotStarted:
        return t('stage_uploadNotStarted');
      case STAGE.uploading:
        return t('stage_uploading');
      case STAGE.uploadFinished:
        return t('stage_uploadFinished');
      default:
        throw new Error(`Invalid stage value: ${currentStage}`);
    }
  };

  const renderUploadItem = (item, itemIndex) => {
    const itemIsEditable = isEditableImageFile(item.file);
    return (
      <div className="FilesUploadOverview-fileStatus">
        <div className="FilesUploadOverview-fileStatusRow">
          {item.status === ITEM_STATUS.pristine && itemIsEditable && (
            <Tooltip title={t('common:edit')}>
              <a onClick={() => handleItemEditClick(itemIndex)}>
                <EditOutlined className="FilesUploadOverview-fileStatusIcon" />
              </a>
            </Tooltip>
          )}
          {item.status === ITEM_STATUS.pristine && !itemIsEditable && (
            <FileOutlined className="FilesUploadOverview-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.preprocessed && itemIsEditable && (
            <Tooltip title={t('common:edit')}>
              <a onClick={() => handleItemEditClick(itemIndex)}>
                <EditOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--processed" />
              </a>
            </Tooltip>
          )}
          {item.status === ITEM_STATUS.preprocessed && !itemIsEditable && (
            <FileOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--processed" />
          )}
          {item.status === ITEM_STATUS.uploading && (
            <LoadingOutlined className="FilesUploadOverview-fileStatusIcon" />
          )}
          {item.status === ITEM_STATUS.succeeded && (
            <CheckOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--success" />
          )}
          {item.status === ITEM_STATUS.failed && (
            <CloseOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--error" />
          )}
          {item.file.name}
          {item.status === ITEM_STATUS.preprocessed && (
            <span className="FilesUploadOverview-fileStatusMessage">({t('preprocessed')})</span>
          )}
        </div>
        {item.errorMessage && <div className="FilesUploadOverview-fileStatusError">{item.errorMessage}</div>}
        {item.status === ITEM_STATUS.succeeded && showPreviewAfterUpload && (
          <div className="FilesUploadOverview-fileStatusPreview">
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
    <div className="FilesUploadOverview">
      <h3 className="FilesUploadOverview-headline">{t('headline')}</h3>
      {storageLocation.type === STORAGE_LOCATION_TYPE.private && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0) && (
        <div className="FilesUploadOverview-usedStorage" >
          <UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />
        </div>
      )}
      <div className="FilesUploadOverview-message" >
        {renderUploadMessage()}
      </div>
      <div className="FilesUploadOverview-fileStatusContainer">
        {uploadItems.map((item, index) => (
          <div key={index.toString()}>
            {renderUploadItem(item, index)}
          </div>
        ))}
      </div>
      <div className="FilesUploadOverview-button" >
        <Button
          type="primary"
          onClick={handleStartUploadClick}
          loading={currentStage === STAGE.uploading}
          disabled={currentStage === STAGE.uploadFinished}
          >
          {t('startUpload')}
        </Button>
      </div>
    </div>
  );
}

FilesUploadOverview.propTypes = {
  directory: cdnObjectShape.isRequired,
  onFileEdit: PropTypes.func,
  onUploadFinish: PropTypes.func,
  showPreviewAfterUpload: PropTypes.bool,
  storageLocation: storageLocationShape.isRequired,
  uploadQueue: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.object.isRequired,
    isPristine: PropTypes.bool.isRequired
  })).isRequired
};

FilesUploadOverview.defaultProps = {
  onFileEdit: () => {},
  onUploadFinish: () => {},
  showPreviewAfterUpload: false
};

export default FilesUploadOverview;

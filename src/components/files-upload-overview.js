import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import UsedStorage from './used-storage.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useLocale } from './locale-context.js';
import { useSetStorageLocation } from './storage-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import React, { useCallback, useEffect, useState } from 'react';
import StorageApiClient from '../api-clients/storage-api-client.js';
import { processFilesBeforeUpload } from '../utils/storage-utils.js';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { cdnObjectShape, storageLocationShape } from '../ui/default-prop-types.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';

function FilesUploadOverview({ files, directory, storageLocation, onUploadFinish }) {
  const { uiLocale } = useLocale();
  const setStorageLocation = useSetStorageLocation();
  const { t } = useTranslation('filesUploadOverview');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [uploadStarted, setUploadStarted] = useState(false);
  const [filesUploadStatus, setFilesUploadStatus] = useState(files
    .reduce((accu, file) => ({ ...accu, [file.name]: { fileName: file.name, uploadEnded: false, error: null } }), {}));

  const canUploadFile = useCallback((file, currentUsedBytes) => {
    if (file.size > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES) {
      setFilesUploadStatus(previousStatus => {
        const newStatus = cloneDeep(previousStatus);
        newStatus[file.name].uploadEnded = true;
        newStatus[file.name].error = t('uploadLimitExceeded', {
          uploadSize: prettyBytes(file.size, { locale: uiLocale }),
          uploadLimit: prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, { locale: uiLocale })
        });
        return newStatus;
      });
      return false;
    }

    if (storageLocation.type === STORAGE_LOCATION_TYPE.private) {
      const availableBytes = Math.max(0, (storageLocation.maxBytes || 0) - currentUsedBytes);
      if (file.size > availableBytes) {
        setFilesUploadStatus(previousStatus => {
          const newStatus = cloneDeep(previousStatus);
          newStatus[file.name].uploadEnded = true;
          newStatus[file.name].error = t('insufficientPrivateStorge');
          return newStatus;
        });
        return false;
      }
    }
    return true;
  }, [storageLocation, uiLocale, t]);

  const uploadFiles = useCallback(async () => {
    const processedFiles = await processFilesBeforeUpload(files);

    let currentUsedBytes = storageLocation.usedBytes;

    for (const file of processedFiles) {
      if (canUploadFile(file, currentUsedBytes)) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const { usedBytes } = await storageApiClient.uploadFiles([file], directory.path);
          currentUsedBytes = usedBytes;
          setFilesUploadStatus(previousStatus => {
            const newStatus = cloneDeep(previousStatus);
            newStatus[file.name].uploadEnded = true;
            return newStatus;
          });
          setStorageLocation({ ...cloneDeep(storageLocation), usedBytes: currentUsedBytes });
        } catch (error) {
          setFilesUploadStatus(previousStatus => {
            const newStatus = cloneDeep(previousStatus);
            newStatus[file.name].uploadEnded = true;
            newStatus[file.name].error = error.message;
            return newStatus;
          });
        }
      }
    }

  }, [directory, files, canUploadFile, storageApiClient, storageLocation, setStorageLocation]);

  useEffect(() => {
    (async () => {
      if (!files.length || uploadStarted) {
        return;
      }
      setUploadStarted(true);
      await uploadFiles();
      onUploadFinish();
    })();
  }, [uploadStarted, files, uploadFiles, onUploadFinish]);

  const renderFileStatus = fileStatus => {
    return (
      <div className="FilesUploadOverview-fileStatus">
        <div className="FilesUploadOverview-fileStatusRow">
          {!fileStatus.uploadEnded && (
          <LoadingOutlined className="FilesUploadOverview-fileStatusIcon" />
          )}
          {fileStatus.uploadEnded && !fileStatus.error && (
          <CheckOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--green" />
          )}
          {fileStatus.uploadEnded && !!fileStatus.error && (
          <CloseOutlined className="FilesUploadOverview-fileStatusIcon FilesUploadOverview-fileStatusIcon--red" />
          )}
          {fileStatus.fileName}
        </div>
        <div className="FilesUploadOverview-fileStatusError">{fileStatus.error?.toString()}</div>
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
      <div className="FilesUploadOverview-fileStatusContainer">
        {Object.values(filesUploadStatus).map(fileStatus => (
          <div key={fileStatus.fileName} data-key={fileStatus.fileName}>
            {renderFileStatus(fileStatus)}
          </div>
        ))}
      </div>
    </div>
  );
}

FilesUploadOverview.propTypes = {
  directory: cdnObjectShape.isRequired,
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUploadFinish: PropTypes.func.isRequired,
  storageLocation: storageLocationShape.isRequired
};

export default FilesUploadOverview;

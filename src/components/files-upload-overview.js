import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useLocale } from './locale-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import React, { useCallback, useEffect, useState } from 'react';
import StorageApiClient from '../api-clients/storage-api-client.js';
import { processFilesBeforeUpload } from '../utils/storage-utils.js';
import { cdnObjectShape, storageLocationShape } from '../ui/default-prop-types.js';
import { LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';

function FilesUploadOverview({ files, directory, storageLocation, onUploadFinish }) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('filesUploadOverview');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [uploadStarted, setUploadStarted] = useState(false);
  const [filesUploadStatus, setFilesUploadStatus] = useState(files.reduce((accu, file) => {
    accu[file.path] = {
      filePath: file.path,
      fileName: file.name,
      uploadEnded: false,
      error: null
    };
    return accu;
  }, {}));

  const canUploadFile = useCallback((file, currentUsedBytes) => {
    if (file.size > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES) {
      setFilesUploadStatus(previousStatus => {
        const newStatus = cloneDeep(previousStatus);
        newStatus[file.path].uploadEnded = true;
        newStatus[file.path].error = t('uploadLimitExceeded', {
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
          newStatus[file.path].uploadEnded = true;
          newStatus[file.path].error = t('insufficientPrivateStorge');
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
            newStatus[file.path].uploadEnded = true;
            return newStatus;
          });
        } catch (error) {
          setFilesUploadStatus(previousStatus => {
            const newStatus = cloneDeep(previousStatus);
            newStatus[file.path].uploadEnded = true;
            newStatus.error = error;
            return newStatus;
          });
        }
      }
    }

    // SetStorageLocation({ ...cloneDeep(storageLocation), usedBytes: currentUsedBytes });

  }, [directory, files, storageApiClient, storageLocation, canUploadFile]);

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

  return (
    <div className="FilesUploadOverview">
      {Object.values(filesUploadStatus).map(status => (
        <div key={status.filePath}>
          Uploading {status.fileName} <span>{status.uploadEnded?.toString()}</span>  <span>{status.error?.toString()}</span>
        </div>
      ))}
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

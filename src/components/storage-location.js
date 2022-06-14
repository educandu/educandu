import debounce from 'debounce';
import PropTypes from 'prop-types';
import prettyBytes from 'pretty-bytes';
import UsedStorage from './used-storage.js';
import FilePreview from './file-preview.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { handleApiError } from '../ui/error-helper.js';
import { DoubleLeftOutlined } from '@ant-design/icons';
import UploadIcon from './icons/general/upload-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import { useSetStorageLocation } from './storage-context.js';
import { Alert, Button, message, Select, Upload } from 'antd';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { getCookie, setSessionCookie } from '../common/cookie.js';
import { storageLocationShape } from '../ui/default-prop-types.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import FilesViewer, { FILES_VIEWER_DISPLAY } from './files-viewer.js';
import { confirmPublicUploadLiability } from './confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { CDN_OBJECT_TYPE, LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getParentPathForStorageLocationPath, getStorageLocationPathForUrl, processFileBeforeUpload } from '../utils/storage-utils.js';

const WIZARD_SCREEN = {
  none: 'none',
  preview: 'preview'
};

function StorageLocation({ storageLocation, initialUrl, onEnterFullscreen, onExitFullscreen, onSelect, onCancel }) {
  const { uiLocale } = useLocale();
  const { t } = useTranslation('storageLocation');
  const setStorageLocation = useSetStorageLocation();
  const { uploadLiabilityCookieName } = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  let filesBeingUploaded = [];

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [wizardScreen, setWizardScreen] = useState(WIZARD_SCREEN.none);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const canUpload = true;

  const fetchStorageContent = useCallback(async () => {
    if (!currentDirectoryPath) {
      return;
    }

    try {
      let result = await storageApiClient.getCdnObjects(currentDirectoryPath);
      if (!result.objects.length) {
        result = await storageApiClient.getCdnObjects(storageLocation.initialPath);
      }
      setParentDirectory(result.parentDirectory);
      setCurrentDirectory(result.currentDirectory);
      setFiles(result.objects);
      setSelectedFile(null);
    } catch (err) {
      message.error(err.message);
    }
  }, [currentDirectoryPath, storageLocation.initialPath, storageApiClient]);

  const handleFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentDirectoryPath(newFile.path);
    } else {
      setSelectedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
  };

  const handleSelectClick = () => {
    onSelect(selectedFile.path);
  };

  const handleDeleteClick = async file => {
    const { usedBytes } = await storageApiClient.deleteCdnObject(file.path);
    await fetchStorageContent();
    setStorageLocation({ ...cloneDeep(storageLocation), usedBytes });
  };

  const handlePreviewClick = () => {
    setWizardScreen(WIZARD_SCREEN.preview);
    onEnterFullscreen();
  };

  const handlePreviewScreenBackClick = () => {
    setWizardScreen(WIZARD_SCREEN.none);
    onExitFullscreen();
  };

  const renderSelectButton = () => <Button type="primary" onClick={handleSelectClick} disabled={!selectedFile}>{t('common:select')}</Button>;

  const handleBeforeUpload = () => {
    return new Promise(resolve => {
      if (storageLocation.type === STORAGE_LOCATION_TYPE.public && !getCookie(uploadLiabilityCookieName)) {
        confirmPublicUploadLiability(t, () => {
          setSessionCookie(uploadLiabilityCookieName, 'true');
          resolve(true);
        }, () => resolve(false));
      } else {
        resolve(true);
      }
    });
  };

  const canUploadFile = ({ file, currentUsedBytes }) => {
    if (file.size > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES) {
      message.error(t('uploadLimitExceeded', {
        uploadSize: prettyBytes(file.size, { locale: uiLocale }),
        uploadLimit: prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, { locale: uiLocale })
      }));
      return false;
    }

    if (storageLocation.type === STORAGE_LOCATION_TYPE.private) {
      const availableBytes = Math.max(0, storageLocation.maxBytes || 0 - currentUsedBytes);

      if (file.size > availableBytes) {
        message.error(t('insufficientPrivateStorge'));
        return false;
      }
    }
    return true;
  };

  const uploadFilesDebounced = debounce(async ({ onProgress } = {}) => {
    if (!filesBeingUploaded.length || isUploading) {
      return;
    }
    setIsUploading(true);

    let uploadInterruped = false;
    let currentUsedBytes = storageLocation.usedBytes;
    const hideUploadingMessage = message.loading(t('uploading', { count: filesBeingUploaded.length }), 0);

    try {
      for (const file of filesBeingUploaded) {
        if (!canUploadFile({ file, currentUsedBytes })) {
          uploadInterruped = true;
          break;
        }
        // eslint-disable-next-line no-await-in-loop
        const { usedBytes } = await storageApiClient.uploadFiles([file], currentDirectory.path, { onProgress });
        currentUsedBytes = usedBytes;
      }
    } catch (error) {
      handleApiError({ error });
    } finally {
      hideUploadingMessage();
      setStorageLocation({ ...cloneDeep(storageLocation), usedBytes: currentUsedBytes });
      filesBeingUploaded = [];

      if (!uploadInterruped) {
        message.success(t('successfullyUploaded', { count: filesBeingUploaded.length }));
      }
    }

    await fetchStorageContent();
    setIsUploading(false);
  }, 300);

  const collectFilesAndUploadDebounced = async file => {
    const processedFile = await processFileBeforeUpload({ file, optimizeImages: true });
    filesBeingUploaded.push(processedFile);

    uploadFilesDebounced();
  };

  const handleCustomUploadRequest = ({ file, onProgress, onSuccess }) => {
    const result = collectFilesAndUploadDebounced(file, { onProgress });
    onSuccess(result);
  };

  useEffect(() => {
    const initialResourcePath = getStorageLocationPathForUrl(initialUrl);
    const initialResourceParentDirectoryPath = getParentPathForStorageLocationPath(initialResourcePath);

    setCurrentDirectoryPath(initialResourceParentDirectoryPath.startsWith(storageLocation.rootPath)
      ? initialResourceParentDirectoryPath
      : storageLocation.initialPath);
  }, [initialUrl, storageLocation.initialPath, storageLocation.rootPath]);

  useEffect(() => {
    setIsLoading(true);
    fetchStorageContent();
    setIsLoading(false);
  }, [fetchStorageContent]);

  return (
    <div className="StorageLocation">
      {wizardScreen === WIZARD_SCREEN.none && (
        <Fragment>
          <div className="StorageLocation-buttonsLine">
            <div />
            <Select
              value={filesViewerDisplay}
              onChange={setFilesViewerDisplay}
              className="StorageLocation-filesViewerSelect"
              options={Object.values(FILES_VIEWER_DISPLAY).map(v => ({ label: t(`filesView_${v}`), value: v }))}
              />
          </div>
          <div className="StorageLocation-filesViewer">
            <FilesViewer
              files={files}
              parentDirectory={parentDirectory}
              display={filesViewerDisplay}
              onFileClick={handleFileClick}
              selectedFileUrl={selectedFile?.portableUrl}
              onDeleteClick={handleDeleteClick}
              onNavigateToParentClick={() => setCurrentDirectoryPath(getParentPathForStorageLocationPath(currentDirectory.path))}
              onPreviewClick={handlePreviewClick}
              canNavigateToParent={currentDirectory?.path?.length > storageLocation.rootPath.length}
              canDelete={storageLocation.isDeletionEnabled}
              isLoading={isLoading}
              />
          </div>
          <div className="StorageLocation-storageInfo">
            {storageLocation.type === STORAGE_LOCATION_TYPE.private
            && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0)
            && (<UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />)}
            {storageLocation.type === STORAGE_LOCATION_TYPE.public && (
            <Alert message={t('publicStorageWarning')} type="warning" showIcon />
            )}
          </div>
          <div className="StorageLocation-buttonsLine">
            <Upload
              multiple
              disabled={!canUpload}
              showUploadList={false}
              beforeUpload={handleBeforeUpload}
              customRequest={handleCustomUploadRequest}
              >
              <Button disabled={!canUpload || isUploading}>
                <UploadIcon />&nbsp;<span>{t('uploadFiles')}</span>
              </Button>
            </Upload>
            <div className="StorageLocation-buttonsGroup">
              <Button onClick={onCancel}>{t('common:cancel')}</Button>
              {renderSelectButton()}
            </div>
          </div>
        </Fragment>
      )}

      {wizardScreen === WIZARD_SCREEN.preview && (
        <div className="StorageLocation-wizardScreen">
          <div className="StorageLocation-wizardScreenBack">
            <DoubleLeftOutlined />
            <a onClick={handlePreviewScreenBackClick}>{t('common:back')}</a>
          </div>
          <FilePreview
            url={selectedFile.url}
            size={selectedFile.size}
            createdOn={selectedFile.createdOn}
            />
          <div className="StorageLocation-wizardScreenSelect">{renderSelectButton()}</div>
        </div>
      )}
    </div>
  );
}

StorageLocation.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
  onSelect: PropTypes.func,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onEnterFullscreen: () => {},
  onExitFullscreen: () => {},
  onSelect: () => {}
};

export default StorageLocation;

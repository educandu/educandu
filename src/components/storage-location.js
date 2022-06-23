import PropTypes from 'prop-types';
import classNames from 'classnames';
import prettyBytes from 'pretty-bytes';
import UsedStorage from './used-storage.js';
import FilePreview from './file-preview.js';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useLocale } from './locale-context.js';
import { useService } from './container-context.js';
import { Alert, Button, message, Select } from 'antd';
import { handleApiError } from '../ui/error-helper.js';
import { DoubleLeftOutlined } from '@ant-design/icons';
import UploadIcon from './icons/general/upload-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import { useSetStorageLocation } from './storage-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { getCookie, setSessionCookie } from '../common/cookie.js';
import { storageLocationShape } from '../ui/default-prop-types.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import FilesViewer, { FILES_VIEWER_DISPLAY } from './files-viewer.js';
import { confirmPublicUploadLiability } from './confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { CDN_OBJECT_TYPE, LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { canUploadToPath, getParentPathForStorageLocationPath, getStorageLocationPathForUrl, processFilesBeforeUpload } from '../utils/storage-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

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

  const dropzoneRef = useRef();
  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [wizardScreen, setWizardScreen] = useState(WIZARD_SCREEN.none);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [canUploadToCurrentDirectory, setCanUploadToCurrentDirectory] = useState(false);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const canAcceptFiles = canUploadToCurrentDirectory && !isUploading && !isLoading;

  const fetchStorageContent = useCallback(async () => {
    if (!currentDirectoryPath || !isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects(currentDirectoryPath);
      if (!isMounted.current) {
        return;
      }

      setCanUploadToCurrentDirectory(canUploadToPath(result.currentDirectory.path));
      setParentDirectory(result.parentDirectory);
      setCurrentDirectory(result.currentDirectory);
      setFiles(result.objects);
      setSelectedFile(null);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.status === 404) {
        setCurrentDirectoryPath(storageLocation.homePath);
      } else {
        message.error(err.message);
      }
    }
  }, [currentDirectoryPath, storageLocation.homePath, storageApiClient, isMounted]);

  const uploadFiles = useCallback(async filesToUpload => {
    const canUploadFile = (file, currentUsedBytes) => {
      if (file.size > LIMIT_PER_STORAGE_UPLOAD_IN_BYTES) {
        message.error(t('uploadLimitExceeded', {
          uploadSize: prettyBytes(file.size, { locale: uiLocale }),
          uploadLimit: prettyBytes(LIMIT_PER_STORAGE_UPLOAD_IN_BYTES, { locale: uiLocale })
        }));
        return false;
      }

      if (storageLocation.type === STORAGE_LOCATION_TYPE.private) {
        const availableBytes = Math.max(0, (storageLocation.maxBytes || 0) - currentUsedBytes);
        if (file.size > availableBytes) {
          message.error(t('insufficientPrivateStorge'));
          return false;
        }
      }
      return true;
    };

    const hideUploadingMessage = message.loading(t('uploading', { count: filesToUpload.length }), 0);

    const processedFiles = await processFilesBeforeUpload(filesToUpload);

    let uploadErrorOccured = false;
    let currentUsedBytes = storageLocation.usedBytes;

    try {
      for (const file of processedFiles) {
        if (canUploadFile(file, currentUsedBytes)) {
          // eslint-disable-next-line no-await-in-loop
          const { usedBytes } = await storageApiClient.uploadFiles([file], currentDirectory.path);
          currentUsedBytes = usedBytes;
        } else {
          uploadErrorOccured = true;
        }
      }
    } catch (error) {
      uploadErrorOccured = true;
      handleApiError({ error });
    }
    setStorageLocation({ ...cloneDeep(storageLocation), usedBytes: currentUsedBytes });

    hideUploadingMessage();

    if (!uploadErrorOccured) {
      message.success(t('successfullyUploaded'));
    }

    await fetchStorageContent();
  }, [currentDirectory, storageLocation, setStorageLocation, storageApiClient, t, uiLocale, fetchStorageContent]);

  const handleFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentDirectoryPath(newFile.path);
    } else {
      setSelectedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
  };

  const handleFileDoubleClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentDirectoryPath(newFile.path);
    } else {
      onSelect(newFile.portableUrl);
    }
  };

  const handleSelectClick = () => {
    onSelect(selectedFile.portableUrl);
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

  const renderSelectButton = () => (
    <Button
      type="primary"
      onClick={handleSelectClick}
      disabled={!selectedFile || isUploading || isLoading}
      >
      {t('common:select')}
    </Button>
  );

  useEffect(() => {
    const checkPreconditions = () => {
      return storageLocation.type === STORAGE_LOCATION_TYPE.public
        ? new Promise(resolve => {
          if (!getCookie(uploadLiabilityCookieName)) {
            confirmPublicUploadLiability(t, () => {
              setSessionCookie(uploadLiabilityCookieName, 'true');
              resolve(true);
            }, () => resolve(false));
          } else {
            resolve(true);
          }
        })
        : true;
    };

    const startUpload = async () => {
      if (!uploadQueue.length || isUploading) {
        return;
      }

      try {
        const preMet = await checkPreconditions();
        if (!preMet || !uploadQueue.length || isUploading) {
          return;
        }

        setIsUploading(true);
        await uploadFiles(uploadQueue);
      } finally {
        setUploadQueue([]);
        setIsUploading(false);
      }
    };

    startUpload();

  }, [uploadQueue, isUploading, uploadFiles, storageLocation.type, uploadLiabilityCookieName, t]);

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  useEffect(() => {
    const initialResourcePath = getStorageLocationPathForUrl(initialUrl);
    const initialResourceParentDirectoryPath = getParentPathForStorageLocationPath(initialResourcePath);

    setCurrentDirectoryPath(initialResourceParentDirectoryPath.startsWith(storageLocation.rootPath)
      ? initialResourceParentDirectoryPath
      : storageLocation.homePath);
  }, [initialUrl, storageLocation.homePath, storageLocation.rootPath]);

  useEffect(() => {
    fetchStorageContent();
  }, [fetchStorageContent]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getFilesViewerClasses = isDragActive => classNames({
    'StorageLocation-filesViewer': true,
    'u-can-drop': isDragActive && canAcceptFiles,
    'u-cannot-drop': isDragActive && !canAcceptFiles
  });

  return (
    <div className="StorageLocation">
      {wizardScreen === WIZARD_SCREEN.none && (
        <Fragment>
          <div className="StorageLocation-buttonsLine">
            <div />
            <div className="StorageLocation-filesViewerSelectContainer">
              <Select
                value={filesViewerDisplay}
                onChange={setFilesViewerDisplay}
                className="StorageLocation-filesViewerSelect"
                options={Object.values(FILES_VIEWER_DISPLAY).map(v => ({ label: t(`filesView_${v}`), value: v }))}
                />
            </div>
          </div>
          <ReactDropzone
            ref={dropzoneRef}
            onDrop={canAcceptFiles ? setUploadQueue : null}
            noKeyboard
            noClick
            >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps({ className: getFilesViewerClasses(isDragActive) })}>
                <input {...getInputProps()} hidden />
                <FilesViewer
                  files={files}
                  parentDirectory={parentDirectory}
                  display={filesViewerDisplay}
                  onFileClick={handleFileClick}
                  onFileDoubleClick={handleFileDoubleClick}
                  selectedFileUrl={selectedFile?.portableUrl}
                  onDeleteClick={handleDeleteClick}
                  onNavigateToParentClick={() => setCurrentDirectoryPath(getParentPathForStorageLocationPath(currentDirectory.path))}
                  onPreviewClick={handlePreviewClick}
                  canNavigateToParent={currentDirectory?.path?.length > storageLocation.rootPath.length}
                  canDelete={storageLocation.isDeletionEnabled}
                  isLoading={isLoading}
                  />
              </div>
            )}
          </ReactDropzone>
          <div className="StorageLocation-storageInfo">
            {storageLocation.type === STORAGE_LOCATION_TYPE.private
            && (storageLocation.usedBytes > 0 || storageLocation.maxBytes > 0)
            && (<UsedStorage usedBytes={storageLocation.usedBytes} maxBytes={storageLocation.maxBytes} showLabel />)}
            {storageLocation.type === STORAGE_LOCATION_TYPE.public && (
            <Alert message={t('publicStorageWarning')} type="warning" showIcon />
            )}
          </div>
          <div className="StorageLocation-buttonsLine">
            <Button
              icon={<UploadIcon />}
              loading={isUploading}
              onClick={handleUploadButtonClick}
              disabled={!canUploadToCurrentDirectory || isLoading}
              >
              {t('uploadFiles')}
            </Button>
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

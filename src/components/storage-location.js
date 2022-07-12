import PropTypes from 'prop-types';
import classNames from 'classnames';
import UsedStorage from './used-storage.js';
import FilePreview from './file-preview.js';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { useService } from './container-context.js';
import { Alert, Button, message, Select } from 'antd';
import { DoubleLeftOutlined } from '@ant-design/icons';
import UploadIcon from './icons/general/upload-icon.js';
import ClientConfig from '../bootstrap/client-config.js';
import FilesUploadOverview from './files-upload-overview.js';
import { useSetStorageLocation } from './storage-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { getResourceFullName } from '../utils/resource-utils.js';
import { getCookie, setSessionCookie } from '../common/cookie.js';
import { storageLocationShape } from '../ui/default-prop-types.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import FilesViewer, { FILES_VIEWER_DISPLAY } from './files-viewer.js';
import { confirmPublicUploadLiability } from './confirmation-dialogs.js';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { canUploadToPath, getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../utils/storage-utils.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const SCREEN = {
  none: 'none',
  preview: 'preview',
  uploadOverview: 'upload-overview'
};

function StorageLocation({ storageLocation, initialUrl, onEnterFullscreen, onExitFullscreen, onSelect, onCancel }) {
  const { t } = useTranslation('storageLocation');
  const setStorageLocation = useSetStorageLocation();
  const { uploadLiabilityCookieName } = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const dropzoneRef = useRef();
  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [screen, setScreen] = useState(SCREEN.none);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [showInitialFileSelection, setShowInitialFileSelection] = useState(true);
  const [canUploadToCurrentDirectory, setCanUploadToCurrentDirectory] = useState(false);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const canAcceptFiles = canUploadToCurrentDirectory && !isLoading;

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

  const handleFileClick = newFile => {
    setShowInitialFileSelection(false);
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
    setScreen(SCREEN.preview);
    onEnterFullscreen();
  };

  const handleUploadButtonClick = () => {
    dropzoneRef.current.open();
  };

  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setScreen(SCREEN.uploadOverview);
    onEnterFullscreen();
  }, [onEnterFullscreen]);

  const handleUploadFinish = () => {
    setUploadQueue([]);
    setIsUploading(false);
  };

  const handlePreviewScreenBackClick = () => {
    setScreen(SCREEN.none);
    onExitFullscreen();
  };

  const handleUploadOverviewScreenBackClick = async () => {
    setScreen(SCREEN.none);
    onExitFullscreen();
    await fetchStorageContent();
  };

  const renderSelectButton = () => (
    <Button
      type="primary"
      onClick={handleSelectClick}
      disabled={!selectedFile || isLoading}
      >
      {t('common:select')}
    </Button>
  );

  const renderScreenBackButton = onClick => {
    return (
      <div className="StorageLocation-screenBack">
        <DoubleLeftOutlined />
        <a onClick={onClick}>{t('common:back')}</a>
      </div>
    );
  };

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
      if (!uploadQueue.length) {
        return;
      }

      const preMet = await checkPreconditions();
      if (!preMet || !uploadQueue.length) {
        return;
      }

      await handleUploadStart();
    };

    startUpload();

  }, [uploadQueue, handleUploadStart, storageLocation.type, uploadLiabilityCookieName, t]);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    const previouslySelectedFileStillExists = (files || []).some(file => file.portableUrl === selectedFile.portableUrl);
    if (!previouslySelectedFileStillExists) {
      setSelectedFile(null);
    }
  }, [selectedFile, files]);

  useEffect(() => {
    if (!files?.length || !showInitialFileSelection) {
      return;
    }

    const initialResourceName = getResourceFullName(initialUrl);

    if (initialResourceName) {
      const preSelectedFile = files.find(file => file.displayName === initialResourceName);
      setSelectedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileSelection, files]);

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
      {screen === SCREEN.none && (
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

      {screen === SCREEN.preview && (
        <div className="StorageLocation-screen">
          {renderScreenBackButton(handlePreviewScreenBackClick)}
          <FilePreview
            url={selectedFile.url}
            size={selectedFile.size}
            createdOn={selectedFile.createdOn}
            />
          <div className="StorageLocation-screenSelect">{renderSelectButton()}</div>
        </div>
      )}

      {screen === SCREEN.uploadOverview && (
        <div className="StorageLocation-screen">
          {renderScreenBackButton(handleUploadOverviewScreenBackClick)}
          <FilesUploadOverview
            files={uploadQueue}
            directory={currentDirectory}
            storageLocation={storageLocation}
            onUploadFinish={handleUploadFinish}
            />
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

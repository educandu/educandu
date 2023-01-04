import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import StorageLocation from './storage-location.js';
import { useService } from '../container-context.js';
import FileEditorScreen from './file-editor-screen.js';
import FilesUploadScreen from './files-upload-screen.js';
import ClientConfig from '../../bootstrap/client-config.js';
import ResourcePreviewScreen from './resource-preview-screen.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { getResourceFullName } from '../../utils/resource-utils.js';
import { getCookie, setSessionCookie } from '../../common/cookie.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmPublicUploadLiability } from '../confirmation-dialogs.js';
import { useSetStorageLocation, useStorage } from '../storage-context.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../../utils/storage-utils.js';

const SCREEN = {
  default: 'default',
  fileEditor: 'file-editor',
  filePreview: 'file-preview',
  filesUpload: 'files-upload'
};

function StorageLocationScreens({ storageLocationType, initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation('');
  const { locations } = useStorage();
  const setStorageLocation = useSetStorageLocation();
  const { uploadLiabilityCookieName } = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.default]);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);
  const [contentFetchingProps, setContentFetchingProps] = useState({ searchTerm: '', currentDirectoryPath: null });

  const storageLocation = locations.find(loc => loc.type === storageLocationType);

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const fetchStorageContent = useCallback(async (searchTerm, parentPath) => {
    if (!storageLocation || !parentPath || !isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects({
        searchTerm: searchTerm || null,
        parentPath: searchTerm ? storageLocation.rootPath : parentPath
      });

      if (!isMounted.current) {
        return;
      }

      setParentDirectory(result.parentDirectory);
      setCurrentDirectory(result.currentDirectory);
      setFiles(result.objects);

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.status === 404 && !searchTerm) {
        setContentFetchingProps({ searchTerm: '', currentDirectoryPath: storageLocation.homePath });
      } else {
        message.error(err.message);
      }
    }
  }, [storageLocation, storageApiClient, isMounted]);

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleDirectoryClick = newFile => {
    setIsLoading(true);
    setContentFetchingProps({ searchTerm: '', currentDirectoryPath: newFile.path });
  };

  const handleFileDoubleClick = newFile => {
    onSelect(newFile.portableUrl);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.portableUrl);
  };

  const handleSelectUploadedFileClick = file => {
    onSelect(file.portableUrl);
  };

  const handleDeleteFileClick = async file => {
    const { usedBytes } = await storageApiClient.deleteCdnObject(file.path);
    setFiles(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
    setStorageLocation({ ...cloneDeep(storageLocation), usedBytes });
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.filePreview);
  };

  const handleScreenBackClick = () => {
    popScreen();
  };

  const handleFilesViewerDisplayChange = value => {
    setFilesViewerDisplay(value);
  };

  const handleFilesUploadScreenBackClick = async () => {
    popScreen();
    setUploadQueue([]);
    setCurrentEditedFileIndex(-1);
    await fetchStorageContent(contentFetchingProps.searchTerm, contentFetchingProps.currentDirectoryPath);
  };

  const handleFilesDropped = fs => {
    setUploadQueue(fs.map(f => ({ file: f, isPristine: true })));
  };

  const handleSearchTermChange = newSearchTerm => {
    setContentFetchingProps(prevState => ({ ...prevState, searchTerm: newSearchTerm }));
  };

  const handleEditFileClick = fileIndex => {
    setCurrentEditedFileIndex(fileIndex);
    pushScreen(SCREEN.fileEditor);
  };

  const handleFileEditorScreenApplyClick = newFile => {
    setUploadQueue(queue => queue.map((item, index) => index !== currentEditedFileIndex ? item : { file: newFile, isPristine: false }));
    popScreen();
  };

  useEffect(() => {
    const checkPreconditions = () => {
      return storageLocation.type === STORAGE_LOCATION_TYPE.documentMedia
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

      pushScreen(SCREEN.filesUpload);
    };

    startUpload();

  }, [uploadQueue, storageLocation.type, uploadLiabilityCookieName, t]);

  useEffect(() => {
    if (!highlightedFile || screen !== SCREEN.default) {
      return;
    }

    const previouslyHighlightedFileStillExists = files.some(file => file.portableUrl === highlightedFile.portableUrl);
    if (!previouslyHighlightedFileStillExists) {
      setHighlightedFile(null);
    }
  }, [screen, contentFetchingProps.searchTerm, highlightedFile, files]);

  useEffect(() => {
    if (!files.length || !showInitialFileHighlighting) {
      return;
    }

    const initialResourceName = getResourceFullName(initialUrl);

    if (initialResourceName) {
      const preSelectedFile = files.find(file => file.displayName === initialResourceName);
      setHighlightedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileHighlighting, files]);

  useEffect(() => {
    const initialResourcePath = getStorageLocationPathForUrl(initialUrl);
    const initialResourceParentDirectoryPath = getParentPathForStorageLocationPath(initialResourcePath);
    const canUseInitialResourceParentDirectoryPath = storageLocation?.rootPath && initialResourceParentDirectoryPath.startsWith(storageLocation.rootPath);
    const newPath = canUseInitialResourceParentDirectoryPath ? initialResourceParentDirectoryPath : storageLocation?.homePath || '';
    setContentFetchingProps(prevState => ({ ...prevState, currentDirectoryPath: newPath }));
  }, [initialUrl, storageLocation?.homePath, storageLocation?.rootPath]);

  useEffect(() => {
    setFiles([]);
    fetchStorageContent(contentFetchingProps.searchTerm, contentFetchingProps.currentDirectoryPath);
  }, [fetchStorageContent, contentFetchingProps]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleNavigateToParent = () => {
    const newCurrentDirectoryPath = getParentPathForStorageLocationPath(currentDirectory.path);
    setContentFetchingProps({ searchTerm: '', currentDirectoryPath: newCurrentDirectoryPath });
  };

  if (!storageLocation) {
    return null;
  }

  return (
    <Fragment>
      {screen === SCREEN.default && (
        <StorageLocation
          files={files}
          isLoading={isLoading}
          searchTerm={contentFetchingProps.searchTerm}
          currentDirectory={currentDirectory}
          parentDirectory={parentDirectory}
          highlightedFile={highlightedFile}
          storageLocation={storageLocation}
          filesViewerDisplay={filesViewerDisplay}
          onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
          onFileClick={handleFileClick}
          onCancelClick={onCancel}
          onDeleteFileClick={handleDeleteFileClick}
          onPreviewFileClick={handlePreviewFileClick}
          onSearchTermChange={handleSearchTermChange}
          onFilesViewerDisplayChange={handleFilesViewerDisplayChange}
          onNavigateToParent={handleNavigateToParent}
          onFilesDropped={handleFilesDropped}
          onDirectoryClick={handleDirectoryClick}
          onFileDoubleClick={handleFileDoubleClick}
          />
      )}

      {screen === SCREEN.filePreview && (
        <ResourcePreviewScreen
          file={highlightedFile}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
          />
      )}

      {screen === SCREEN.filesUpload && (
        <FilesUploadScreen
          uploadQueue={uploadQueue}
          directory={currentDirectory}
          storageLocation={storageLocation}
          onCancelClick={onCancel}
          onEditFileClick={handleEditFileClick}
          onBackClick={handleFilesUploadScreenBackClick}
          onSelectFileClick={handleSelectUploadedFileClick}
          />
      )}

      {screen === SCREEN.fileEditor && (
        <FileEditorScreen
          file={uploadQueue[currentEditedFileIndex].file}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onApplyClick={handleFileEditorScreenApplyClick}
          />
      )}
    </Fragment>
  );
}

StorageLocationScreens.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
  storageLocationType: PropTypes.oneOf(Object.values(STORAGE_LOCATION_TYPE)).isRequired
};

StorageLocationScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default StorageLocationScreens;

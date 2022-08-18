import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import StorageLocation from './storage-location.js';
import { useService } from '../container-context.js';
import FileEditorScreen from './file-editor-screen.js';
import FilePreviewScreen from './file-preview-screen.js';
import FilesUploadScreen from './files-upload-screen.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useSetStorageLocation } from '../storage-context.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import { getResourceFullName } from '../../utils/resource-utils.js';
import { getCookie, setSessionCookie } from '../../common/cookie.js';
import { storageLocationShape } from '../../ui/default-prop-types.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { confirmPublicUploadLiability } from '../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { CDN_OBJECT_TYPE, FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';
import { getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../../utils/storage-utils.js';

const SCREEN = {
  default: 'default',
  fileEditor: 'file-editor',
  filePreview: 'file-preview',
  filesUpload: 'files-upload'
};

function StorageLocationScreens({ storageLocation, initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation('');
  const setStorageLocation = useSetStorageLocation();
  const { uploadLiabilityCookieName } = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const isMounted = useRef(false);
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.default]);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const fetchStorageContent = useCallback(async searchText => {
    if (!currentDirectoryPath || !isMounted.current) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects({
        parentPath: searchText ? storageLocation.rootPath : currentDirectoryPath,
        searchTerm: searchText || null,
        recursive: !!searchText
      });

      if (!isMounted.current) {
        return;
      }

      if (searchText) {
        setSearchResult(result.objects);
      } else {
        setParentDirectory(result.parentDirectory);
        setCurrentDirectory(result.currentDirectory);
        setFiles(result.objects);
      }

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err.status === 404 && !searchText) {
        setCurrentDirectoryPath(storageLocation.homePath);
      } else {
        message.error(err.message);
      }
    }
  }, [currentDirectoryPath, storageLocation.homePath, storageLocation.rootPath, storageApiClient, isMounted]);

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleDirectoryClick = newFile => {
    setIsLoading(true);
    setCurrentDirectoryPath(newFile.path);
  };

  const handleFileDoubleClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.file) {
      onSelect(newFile.portableUrl);
    }
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setIsLoading(true);
      setCurrentDirectoryPath(newFile.path);
    }
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
    setSearchResult(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
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
    await fetchStorageContent();
  };

  const handleFilesDropped = fs => {
    setUploadQueue(fs.map(f => ({ file: f, isPristine: true })));
  };

  const handleSearchTermChange = async newSearchTerm => {
    setSearchTerm(newSearchTerm);
    await fetchStorageContent(newSearchTerm);
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

      pushScreen(SCREEN.filesUpload);
    };

    startUpload();

  }, [uploadQueue, storageLocation.type, uploadLiabilityCookieName, t]);

  useEffect(() => {
    if (!highlightedFile || screen !== SCREEN.default) {
      return;
    }

    const collectionToUse = searchTerm ? searchResult : files;
    const previouslyHighlightedFileStillExists = collectionToUse.some(file => file.portableUrl === highlightedFile.portableUrl);
    if (!previouslyHighlightedFileStillExists) {
      setHighlightedFile(null);
    }
  }, [screen, searchTerm, highlightedFile, files, searchResult]);

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

  return (
    <Fragment>
      {screen === SCREEN.default && (
        <StorageLocation
          files={searchTerm ? searchResult : files}
          isLoading={isLoading}
          searchTerm={searchTerm}
          currentDirectory={currentDirectory}
          currentDirectoryPath={currentDirectoryPath}
          parentDirectory={searchTerm ? null : parentDirectory}
          highlightedFile={highlightedFile}
          storageLocation={storageLocation}
          filesViewerDisplay={filesViewerDisplay}
          onSelectFileClick={handleSelectHighlightedFileClick}
          onFileClick={handleFileClick}
          onCancelClick={onCancel}
          onDeleteFileClick={handleDeleteFileClick}
          onPreviewFileClick={handlePreviewFileClick}
          onSearchTermChange={handleSearchTermChange}
          onFilesViewerDisplayChange={handleFilesViewerDisplayChange}
          onNavigateToParent={() => setCurrentDirectoryPath(getParentPathForStorageLocationPath(currentDirectory.path))}
          onFilesDropped={handleFilesDropped}
          onDirectoryClick={handleDirectoryClick}
          onFileDoubleClick={handleFileDoubleClick}
          />
      )}

      {screen === SCREEN.filePreview && (
        <FilePreviewScreen
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
  storageLocation: storageLocationShape.isRequired
};

StorageLocationScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default StorageLocationScreens;

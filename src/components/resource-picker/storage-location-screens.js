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
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { FILES_VIEWER_DISPLAY, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

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

  const [files, setFiles] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.default]);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const storageLocation = locations.find(loc => loc.type === storageLocationType);

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const displayedFiles = useMemo(() => {
    return files.filter(file => file.displayName.toLowerCase().includes(filterText.toLowerCase()));
  }, [filterText, files]);

  const fetchStorageContent = useCallback(async () => {
    if (!storageLocation) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects({ parentPath: storageLocation.path });

      setFiles(result.objects);

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      message.error(err.message);
    }
  }, [storageLocation, storageApiClient]);

  const handleFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
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
    setFilterText('');
    setUploadQueue([]);
    setCurrentEditedFileIndex(-1);
    await fetchStorageContent();
  };

  const handleFilesDropped = fs => {
    setUploadQueue(fs.map(f => ({ file: f, isPristine: true })));
  };

  const handleFilterTextChange = value => {
    setFilterText(value);
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

    const previouslyHighlightedFileStillExists = displayedFiles.some(file => file.portableUrl === highlightedFile.portableUrl);
    if (!previouslyHighlightedFileStillExists) {
      setHighlightedFile(null);
    }
  }, [screen, highlightedFile, displayedFiles]);

  useEffect(() => {
    if (!displayedFiles.length || !showInitialFileHighlighting) {
      return;
    }

    const initialResourceName = getResourceFullName(initialUrl);

    if (initialResourceName) {
      const preSelectedFile = displayedFiles.find(file => file.displayName === initialResourceName);
      setHighlightedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileHighlighting, displayedFiles]);

  useEffect(() => {
    fetchStorageContent();
  }, [fetchStorageContent]);

  if (!storageLocation) {
    return null;
  }

  return (
    <Fragment>
      {screen === SCREEN.default && (
        <StorageLocation
          files={displayedFiles}
          isLoading={isLoading}
          filterText={filterText}
          highlightedFile={highlightedFile}
          storageLocation={storageLocation}
          filesViewerDisplay={filesViewerDisplay}
          onSelectHighlightedFileClick={handleSelectHighlightedFileClick}
          onFileClick={handleFileClick}
          onCancelClick={onCancel}
          onDeleteFileClick={handleDeleteFileClick}
          onPreviewFileClick={handlePreviewFileClick}
          onFilterTextChange={handleFilterTextChange}
          onFilesViewerDisplayChange={handleFilesViewerDisplayChange}
          onFilesDropped={handleFilesDropped}
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
  storageLocationType: PropTypes.oneOf([STORAGE_LOCATION_TYPE.roomMedia, STORAGE_LOCATION_TYPE.documentMedia]).isRequired
};

StorageLocationScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default StorageLocationScreens;

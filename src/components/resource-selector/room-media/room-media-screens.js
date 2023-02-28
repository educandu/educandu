import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import cloneDeep from '../../../utils/clone-deep.js';
import { useService } from '../../container-context.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import RoomMediaUploadScreen from './room-media-upload-screen.js';
import RoomMediaDefaultScreen from './room-media-default-screen.js';
import { FILES_VIEWER_DISPLAY } from '../../../domain/constants.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import { useSetStorage, useStorage } from '../../storage-context.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import StorageApiClient from '../../../api-clients/storage-api-client.js';
import { confirmMediaFileHardDelete } from '../../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

const SCREEN = {
  default: 'default',
  editor: 'editor',
  upload: 'upload',
  preview: 'preview'
};

function RoomMediaScreens({ initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation('');
  const storage = useStorage();
  const setStorage = useSetStorage();
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

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const displayedFiles = useMemo(() => {
    return files.filter(file => file.displayName.toLowerCase().includes(filterText.toLowerCase()));
  }, [filterText, files]);

  const fetchStorageContent = useCallback(async () => {
    if (!storage) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await storageApiClient.getCdnObjects({ parentPath: storage.path });

      setFiles(result.objects);
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [storage, storageApiClient]);

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

  const handleDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.displayName, async () => {
      const { usedBytes } = await storageApiClient.deleteCdnObject(file.path);
      setFiles(oldItems => oldItems.filter(item => item.portableUrl !== file.portableUrl));
      setStorage({ ...cloneDeep(storage), usedBytes });
    });
  };

  const handlePreviewFileClick = () => {
    pushScreen(SCREEN.preview);
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
    pushScreen(SCREEN.editor);
  };

  const handleFileEditorScreenApplyClick = newFile => {
    setUploadQueue(queue => queue.map((item, index) => index !== currentEditedFileIndex ? item : { file: newFile, isPristine: false }));
    popScreen();
  };

  useEffect(() => {
    if (!uploadQueue.length) {
      return;
    }

    pushScreen(SCREEN.upload);
  }, [uploadQueue, uploadLiabilityCookieName, t]);

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

    const initialResourceName = urlUtils.getFileName(initialUrl);

    if (initialResourceName) {
      const preSelectedFile = displayedFiles.find(file => file.displayName === initialResourceName);
      setHighlightedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileHighlighting, displayedFiles]);

  useEffect(() => {
    fetchStorageContent();
  }, [fetchStorageContent]);

  if (!storage) {
    return null;
  }

  return (
    <Fragment>
      {screen === SCREEN.default && (
        <RoomMediaDefaultScreen
          files={displayedFiles}
          isLoading={isLoading}
          filterText={filterText}
          highlightedFile={highlightedFile}
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

      {screen === SCREEN.preview && (
        <ResourcePreviewScreen
          file={highlightedFile}
          onCancelClick={onCancel}
          onBackClick={handleScreenBackClick}
          onSelectClick={handleSelectHighlightedFileClick}
          />
      )}

      {screen === SCREEN.upload && (
        <RoomMediaUploadScreen
          uploadQueue={uploadQueue}
          onCancelClick={onCancel}
          onEditFileClick={handleEditFileClick}
          onBackClick={handleFilesUploadScreenBackClick}
          onSelectFileClick={handleSelectUploadedFileClick}
          />
      )}

      {screen === SCREEN.editor && (
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

RoomMediaScreens.propTypes = {
  initialUrl: PropTypes.string,
  onCancel: PropTypes.func,
  onSelect: PropTypes.func
};

RoomMediaScreens.defaultProps = {
  initialUrl: null,
  onCancel: () => {},
  onSelect: () => {}
};

export default RoomMediaScreens;

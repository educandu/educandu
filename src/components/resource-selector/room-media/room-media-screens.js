import { message } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../../utils/url-utils.js';
import FileEditorScreen from '../shared/file-editor-screen.js';
import RoomMediaUploadScreen from './room-media-upload-screen.js';
import RoomMediaDefaultScreen from './room-media-default-screen.js';
import { FILES_VIEWER_DISPLAY } from '../../../domain/constants.js';
import RoomApiClient from '../../../api-clients/room-api-client.js';
import { useSessionAwareApiClient } from '../../../ui/api-helper.js';
import ResourcePreviewScreen from '../shared/resource-preview-screen.js';
import { confirmMediaFileHardDelete } from '../../confirmation-dialogs.js';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRoomMediaContext, useSetRoomMediaContext } from '../../room-media-context.js';

const SCREEN = {
  default: 'default',
  editor: 'editor',
  upload: 'upload',
  preview: 'preview'
};

function RoomMediaScreens({ initialUrl, onSelect, onCancel }) {
  const { t } = useTranslation('');
  const roomMediaContext = useRoomMediaContext(null);
  const setRoomMediaContext = useSetRoomMediaContext();
  const roomApiClient = useSessionAwareApiClient(RoomApiClient);

  const [files, setFiles] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [highlightedFile, setHighlightedFile] = useState(null);
  const [screenStack, setScreenStack] = useState([SCREEN.default]);
  const [currentEditedFileIndex, setCurrentEditedFileIndex] = useState(-1);
  const [showInitialFileHighlighting, setShowInitialFileHighlighting] = useState(true);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const roomId = roomMediaContext?.roomId || null;

  const screen = screenStack[screenStack.length - 1];
  const pushScreen = newScreen => setScreenStack(oldVal => oldVal[oldVal.length - 1] !== newScreen ? [...oldVal, newScreen] : oldVal);
  const popScreen = () => setScreenStack(oldVal => oldVal.length > 1 ? oldVal.slice(0, -1) : oldVal);

  const displayedFiles = useMemo(() => {
    return files.filter(file => file.name.toLowerCase().includes(filterText.toLowerCase()));
  }, [filterText, files]);

  const fetchStorageContent = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      setIsLoading(true);
      const { storagePlan, usedBytes, roomStorage } = await roomApiClient.getAllRoomMedia({ roomId });
      setFiles(roomStorage.objects);
      setRoomMediaContext(oldContext => ({ ...oldContext, maxBytes: storagePlan?.maxBytes || 0, usedBytes }));
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, setRoomMediaContext, roomApiClient]);

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
    confirmMediaFileHardDelete(t, file.name, async () => {
      const { storagePlan, usedBytes, roomStorage } = await roomApiClient.deleteRoomMedia({ roomId, name: file.name });
      setFiles(roomStorage.objects);
      setRoomMediaContext(oldContext => ({ ...oldContext, maxBytes: storagePlan.maxBytes, usedBytes }));
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
    if (uploadQueue.length) {
      pushScreen(SCREEN.upload);
    }
  }, [uploadQueue]);

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
      const preSelectedFile = displayedFiles.find(file => file.name === initialResourceName);
      setHighlightedFile(preSelectedFile);
    }
  }, [initialUrl, showInitialFileHighlighting, displayedFiles]);

  useEffect(() => {
    fetchStorageContent();
  }, [fetchStorageContent]);

  if (!roomMediaContext) {
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

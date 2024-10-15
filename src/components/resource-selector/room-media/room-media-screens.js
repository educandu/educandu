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
  const [uploadScreenPreviewedFileIndex, setUploadScreenPreviewedFileIndex] = useState(0);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

  const roomId = roomMediaContext?.singleRoomMediaOverview.roomStorage.roomId || null;

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
      const newSingleRoomMediaOverview = await roomApiClient.getSingleRoomMediaOverview({ roomId });
      setFiles(newSingleRoomMediaOverview.roomStorage.roomMediaItems);
      setRoomMediaContext(oldContext => (
        {
          ...oldContext,
          singleRoomMediaOverview: newSingleRoomMediaOverview
        }
      ));
    } catch (err) {
      message.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, setRoomMediaContext, roomApiClient]);

  const handleDefaultScreenFileClick = newFile => {
    setShowInitialFileHighlighting(false);
    setHighlightedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
  };

  const handleDefaultScreenFileDoubleClick = newFile => {
    onSelect(newFile.portableUrl);
  };

  const handleSelectHighlightedFileClick = () => {
    onSelect(highlightedFile.portableUrl);
  };

  const handleUploadScreenSelectUrl = portableUrl => {
    onSelect(portableUrl);
  };

  const handleDefaultScreenDeleteFileClick = file => {
    confirmMediaFileHardDelete(t, file.name, async () => {
      const { storagePlan, usedBytes, roomStorage } = await roomApiClient.deleteRoomMedia({ roomId, roomMediaItemId: file._id });
      setFiles(roomStorage.roomMediaItems);
      setRoomMediaContext(oldContext => ({ ...oldContext, maxBytes: storagePlan.maxBytes, usedBytes }));
    });
  };

  const handleDefaultScreenPreviewFileClick = () => {
    pushScreen(SCREEN.preview);
  };

  const handleScreenBackClick = () => {
    popScreen();
  };

  const handleDefaultScreenFilesViewerDisplayChange = value => {
    setFilesViewerDisplay(value);
  };

  const handleUploadScreenBackClick = async () => {
    popScreen();
    setFilterText('');
    setUploadQueue([]);
    setCurrentEditedFileIndex(-1);
    setUploadScreenPreviewedFileIndex(0);
    await fetchStorageContent();
  };

  const handleDefaultScreenFilesDropped = fs => {
    setUploadQueue(fs.map(f => ({ file: f, isPristine: true })));
  };

  const handleDefaultScreenFilterTextChange = value => {
    setFilterText(value);
  };

  const handleUploadScreenFileClick = fileIndex => {
    setUploadScreenPreviewedFileIndex(fileIndex);
  };

  const handleUpoadScreenEditFileClick = fileIndex => {
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
          onFileClick={handleDefaultScreenFileClick}
          onCancelClick={onCancel}
          onDeleteFileClick={handleDefaultScreenDeleteFileClick}
          onPreviewFileClick={handleDefaultScreenPreviewFileClick}
          onFilterTextChange={handleDefaultScreenFilterTextChange}
          onFilesViewerDisplayChange={handleDefaultScreenFilesViewerDisplayChange}
          onFilesDropped={handleDefaultScreenFilesDropped}
          onFileDoubleClick={handleDefaultScreenFileDoubleClick}
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
          previewedFileIndex={uploadScreenPreviewedFileIndex}
          onCancelClick={onCancel}
          onFileClick={handleUploadScreenFileClick}
          onEditFileClick={handleUpoadScreenEditFileClick}
          onBackClick={handleUploadScreenBackClick}
          onSelectUrl={handleUploadScreenSelectUrl}
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

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { CDN_OBJECT_TYPE } from '../domain/constants.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { storageLocationShape } from '../ui/default-prop-types.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import FilesViewer, { FILE_VIEWER_DISPLAY } from './files-viewer.js';
import { getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../utils/storage-utils.js';

function StorageLocation({ storageLocation, initialUrl, isFullscreen, onEnterFullscreen, onExitFullscreen, onSelect, onCancel }) {
  const { t } = useTranslation('storageLocation');
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentLoadedDirectoryPath, setCurrentLoadedDirectoryPath] = useState(null);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILE_VIEWER_DISPLAY.list);

  const handleFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentLoadedDirectoryPath(newFile.path);
    } else {
      setSelectedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
  };

  const handleDeleteClick = () => {
    // eslint-disable-next-line no-console
    console.log('onDeleteClick');
  };

  const handlePreviewClick = () => {
    // eslint-disable-next-line no-console
    console.log('onPreviewClick');
  };

  useEffect(() => {
    const initialResourcePath = getStorageLocationPathForUrl(initialUrl);
    const initialResourceParentDirectoryPath = getParentPathForStorageLocationPath(initialResourcePath);
    setCurrentLoadedDirectoryPath(initialResourceParentDirectoryPath || storageLocation.initialPath);
  }, [initialUrl, storageLocation]);

  useEffect(() => {
    if (!currentLoadedDirectoryPath) {
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        let result = await storageApiClient.getCdnObjects(currentLoadedDirectoryPath);
        if (!result.objects.length) {
          result = await storageApiClient.getCdnObjects(storageLocation.initialPath);
        }
        setParentDirectory(result.parentDirectory);
        setCurrentDirectory(result.currentDirectory);
        setFiles(result.objects);
        setSelectedFile(null);
      } catch (err) {
        message.error(err.message);
      } finally {
        setIsLoading(false);
        setCurrentLoadedDirectoryPath(null);
      }
    })();
  }, [storageLocation, currentLoadedDirectoryPath, storageApiClient]);

  return (
    <div className="StorageLocation">
      <div className="StorageLocation-buttonsLine">
        <div />
        <Select
          value={filesViewerDisplay}
          onChange={setFilesViewerDisplay}
          className="StorageLocation-filesViewerSelect"
          options={Object.values(FILE_VIEWER_DISPLAY).map(v => ({ label: t(`filesView_${v}`), value: v }))}
          />
      </div>
      <div className="StorageLocation-filesViewer">
        <FilesViewer
          files={files}
          currentDirectory={currentDirectory}
          parentDirectory={parentDirectory}
          display={filesViewerDisplay}
          onFileClick={handleFileClick}
          selectedFileUrl={selectedFile?.portableUrl}
          onDeleteClick={handleDeleteClick}
          onNavigateToParentClick={() => setCurrentLoadedDirectoryPath(getParentPathForStorageLocationPath(currentDirectory.path))}
          onPreviewClick={handlePreviewClick}
          canNavigateToParent={currentDirectory?.path?.length > storageLocation.rootPath.length}
          canDelete={storageLocation.isDeletionEnabled}
          isLoading={isLoading}
          />
      </div>
      <div className="StorageLocation-buttonsLine">
        {isFullscreen && <Button onClick={onExitFullscreen}>Exit fullscreen mode</Button>}
        {!isFullscreen && <Button onClick={onEnterFullscreen}>Enter fullscreen mode</Button>}
        <div className="StorageLocation-buttonsGroup">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={onSelect}>OK</Button>
        </div>
      </div>
    </div>
  );
}

StorageLocation.propTypes = {
  initialUrl: PropTypes.string,
  isFullscreen: PropTypes.bool,
  onCancel: PropTypes.func,
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
  onSelect: PropTypes.func,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  initialUrl: null,
  isFullscreen: false,
  onCancel: () => {},
  onEnterFullscreen: () => {},
  onExitFullscreen: () => {},
  onSelect: () => {}
};

export default StorageLocation;

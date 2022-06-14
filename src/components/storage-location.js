import PropTypes from 'prop-types';
import UsedStorage from './used-storage.js';
import FilePreview from './file-preview.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../utils/clone-deep.js';
import { Alert, Button, message, Select } from 'antd';
import { DoubleLeftOutlined } from '@ant-design/icons';
import { useSetStorageLocation } from './storage-context.js';
import { useSessionAwareApiClient } from '../ui/api-helper.js';
import { storageLocationShape } from '../ui/default-prop-types.js';
import StorageApiClient from '../api-clients/storage-api-client.js';
import FilesViewer, { FILES_VIEWER_DISPLAY } from './files-viewer.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../domain/constants.js';
import { getParentPathForStorageLocationPath, getStorageLocationPathForUrl } from '../utils/storage-utils.js';

const WIZARD_SCREEN = {
  none: 'none',
  preview: 'preview'
};

function StorageLocation({ storageLocation, initialUrl, onEnterFullscreen, onExitFullscreen, onSelect, onCancel }) {
  const { t } = useTranslation('storageLocation');
  const setStorageLocation = useSetStorageLocation();
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [currentDirectoryPath, setCurrentDirectoryPath] = useState(null);
  const [wizardScreen, setWizardScreen] = useState(WIZARD_SCREEN.none);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILES_VIEWER_DISPLAY.grid);

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
            <div />
            <div className="StorageLocation-buttonsGroup">
              <Button onClick={onCancel}>{t('common:cancel')}</Button>
              <Button type="primary" onClick={onSelect}>{t('common:select')}</Button>
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

          <Button className="StorageLocation-wizardScreenSelect" type="primary" onClick={onSelect}>{t('common:select')}</Button>
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

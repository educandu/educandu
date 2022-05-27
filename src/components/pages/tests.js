/* eslint-disable no-console */

import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import { useStorage } from '../storage-context.js';
import DebouncedInput from '../debounced-input.js';
import React, { useEffect, useState } from 'react';
import { Button, message, Modal, Select } from 'antd';
import ResourceSelector from '../resource-selector.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import FilesViewer, { FILE_VIEWER_DISPLAY } from '../files-viewer.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import { CDN_OBJECT_TYPE, STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

function Tests({ PageTemplate }) {
  const { locations } = useStorage();
  const currentLocation = locations[0];
  const [files, setFiles] = useState([]);
  const [initialUrl, setInitialUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILE_VIEWER_DISPLAY.list);
  const [currentDisplayedDirectoryPath, setCurrentDisplayedDirectoryPath] = useState(null);
  const [isResourceSelectorModalVisible, setIsResourceSelectorModalVisible] = useState(false);
  const [currentLoadedDirectoryPath, setCurrentLoadedDirectoryPath] = useState(currentLocation.initialPath);

  useEffect(() => {
    if (!currentLoadedDirectoryPath) {
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setSelectedFile(null);
        const responseData = await storageApiClient.getCdnObjects(currentLoadedDirectoryPath);
        setCurrentDisplayedDirectoryPath(currentLoadedDirectoryPath);
        setCurrentLoadedDirectoryPath(null);
        setFiles(responseData.objects);
      } catch (err) {
        console.log(err);
        message.error(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentLoadedDirectoryPath, storageApiClient]);

  const handleOpenResourceSelectorModalClick = () => {
    setIsResourceSelectorModalVisible(true);
  };

  const handleOnFileClick = newFile => {
    if (newFile.type === CDN_OBJECT_TYPE.directory) {
      setCurrentLoadedDirectoryPath(newFile.path);
    } else {
      setSelectedFile(oldFile => oldFile?.url === newFile.url ? null : newFile);
    }
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>Storage Browser</h1>
        <div>
          INITIAL URL:
          &nbsp;
          <DebouncedInput value={initialUrl} onChange={setInitialUrl} />
          &nbsp;
          <Button onClick={handleOpenResourceSelectorModalClick}>Open in modal window</Button>
        </div>
        <div>
          <ResourceSelector
            allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
            initialUrl={initialUrl}
            />
          <Modal visible={isResourceSelectorModalVisible}>
            <ResourceSelector
              allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
              initialUrl={initialUrl}
              />
          </Modal>
        </div>
        <hr />
        <h1>Files Viewer</h1>
        <div>
          DISPLAY:
          &nbsp;
          <Select
            options={Object.values(FILE_VIEWER_DISPLAY).map(v => ({ label: v, value: v }))}
            value={filesViewerDisplay}
            onChange={setFilesViewerDisplay}
            />
          <br />
          CURRENT DIRECTORY:
          &nbsp;
          {currentDisplayedDirectoryPath || '---'}
          <br />
          SELECTED FILE:
          &nbsp;
          {selectedFile?.displayName || '---'}
        </div>
        <br />
        <div style={{ height: '400px', display: 'flex', justifyContent: 'stretch', alignItems: 'stretch', border: '1px solid gray' }}>
          <FilesViewer
            files={files}
            display={filesViewerDisplay}
            onFileClick={handleOnFileClick}
            selectedFileUrl={selectedFile?.portableUrl}
            onDeleteClick={() => console.log('onDeleteClick')}
            onNavigateToParentClick={() => setCurrentLoadedDirectoryPath(currentDisplayedDirectoryPath.split('/').slice(0, -1).join('/'))}
            onPreviewClick={() => console.log('onPreviewClick')}
            canNavigateToParent={currentDisplayedDirectoryPath?.length > currentLocation.rootPath.length}
            canDelete={currentLocation.isDeletionEnabled}
            isLoading={isLoading}
            />
        </div>
        <hr />
        <h1>File preview</h1>
        <h6>IMAGE (Raster)</h6>
        <div style={{ backgroundColor: '#f6f6f6', padding: '20px' }}>
          <FilePreview
            url="https://cdn.openmusic.academy/media/mDCkjepG3D61cX4FNBQxts/monteverdi-ninfa-x2mmMBkoJjnRvGghHQDPaQ.jpg"
            createdOn={new Date('2022-03-04T09:48:46.524Z')}
            size={44722}
            />
        </div>
        <hr />
        <h6>IMAGE (Vector)</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-cEwMkaVH1gREuT3j2NL4mt.svg"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>AUDIO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-2tcutSeJZftuDjiwmVeE47.mp3"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>VIDEO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/rRsbyWevSf5k8bRzvL6N8q/Basis%C3%BCbung%20F-Dur_2pJv5pTWv2B5yELgMUoJyB.mp4"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>PDF</h6>
        <FilePreview
          url="https://upload.wikimedia.org/wikipedia/commons/b/b5/Romanorum_pontificum.pdf"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>GENERIC</h6>
        <FilePreview
          url="https://non.existent.com/file.backup"
          createdOn={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;

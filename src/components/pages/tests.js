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
  const [parentDirectory, setParentDirectory] = useState(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);
  const [filesViewerDisplay, setFilesViewerDisplay] = useState(FILE_VIEWER_DISPLAY.list);
  const [isResourceSelectorModalVisible, setIsResourceSelectorModalVisible] = useState(false);
  const [currentLoadedDirectoryPath, setCurrentLoadedDirectoryPath] = useState(currentLocation.initialPath);

  useEffect(() => {
    if (!currentLoadedDirectoryPath) {
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        const result = await storageApiClient.getCdnObjects(currentLoadedDirectoryPath);
        setParentDirectory(result.parentDirectory);
        setCurrentDirectory(result.currentDirectory);
        setFiles(result.objects);
        setSelectedFile(null);
      } catch (err) {
        console.log(err);
        message.error(err.message);
      } finally {
        setIsLoading(false);
        setCurrentLoadedDirectoryPath(null);
      }
    })();
  }, [currentLoadedDirectoryPath, storageApiClient]);

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
        <h1>Resource Selector</h1>
        <div style={{ marginBottom: '25px' }}>
          <Button onClick={() => setIsResourceSelectorModalVisible(true)}>Open in modal window</Button>
        </div>
        <div style={{ marginBottom: '25px' }}>
          INITIAL URL:
          &nbsp;
          <DebouncedInput value={initialUrl} onChange={setInitialUrl} />
        </div>
        <div style={{ height: '400px', border: '1px solid gray' }}>
          <ResourceSelector
            allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
            initialUrl={initialUrl}
            />
          <Modal
            footer={null}
            closable={false}
            visible={isResourceSelectorModalVisible}
            >
            <ResourceSelector
              allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
              initialUrl={initialUrl}
              onSelect={() => setIsResourceSelectorModalVisible(false)}
              onCancel={() => setIsResourceSelectorModalVisible(false)}
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
          PARENT DIRECTORY PATH:
          &nbsp;
          {parentDirectory?.path || '---'}
          <br />
          PARENT DIRECTORY DISPLAY NAME:
          &nbsp;
          {parentDirectory?.displayName || '---'}
          <br />
          CURRENT DIRECTORY PATH:
          &nbsp;
          {currentDirectory?.path || '---'}
          <br />
          CURRENT DIRECTORY DISPLAY NAME:
          &nbsp;
          {currentDirectory?.displayName || '---'}
          <br />
          SELECTED FILE:
          &nbsp;
          {selectedFile?.displayName || '---'}
        </div>
        <br />
        <div style={{ height: '400px', display: 'flex', justifyContent: 'stretch', alignItems: 'stretch', border: '1px solid gray' }}>
          <FilesViewer
            files={files}
            currentDirectory={currentDirectory}
            parentDirectory={parentDirectory}
            display={filesViewerDisplay}
            onFileClick={handleOnFileClick}
            selectedFileUrl={selectedFile?.portableUrl}
            onDeleteClick={() => console.log('onDeleteClick')}
            onNavigateToParentClick={() => setCurrentLoadedDirectoryPath(currentDirectory.path.split('/').slice(0, -1).join('/'))}
            onPreviewClick={() => console.log('onPreviewClick')}
            canNavigateToParent={currentDirectory?.path?.length > currentLocation.rootPath.length}
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

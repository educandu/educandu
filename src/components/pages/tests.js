import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import { useService } from '../container-context.js';
import FilesGridViewer from '../files-grid-viewer.js';
import FilesListViewer from '../files-list-viewer.js';
import { getPathSegments } from '../../ui/path-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';

function Tests({ PageTemplate }) {
  const [files, setFiles] = useState([]);
  const clientConfig = useService(ClientConfig);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const convertCdnObjectsToFileRecords = useCallback(objects => {
    return objects.map(obj => {
      const isDirectory = !obj.name;
      const path = obj.name || obj.prefix;
      const segments = getPathSegments(path);
      const name = segments[segments.length - 1];
      const url = isDirectory ? null : `${clientConfig.cdnRootUrl}/${path}`;

      return { name, path, size: obj.size, lastModified: obj.lastModified, isDirectory, url };
    });
  }, [clientConfig]);

  useEffect(() => {
    (async () => {
      const { objects } = await storageApiClient.getObjects('media/wjqSKgjiVoTjRWkFaagQfR/');
      setFiles(convertCdnObjectsToFileRecords(objects));
    })();
  }, [storageApiClient, convertCdnObjectsToFileRecords]);

  const handleFileClick = file => {
    // eslint-disable-next-line no-console
    console.log(`Clicked file '${file.name}'`);
  };

  const handleNavigateToParentClick = () => {
    // eslint-disable-next-line no-console
    console.log('Clicked "navigate to parent"');
  };

  const handleFileSelectionChange = file => {
    // eslint-disable-next-line no-console
    console.log('File selected: ', file?.name || null);
  };

  const handleDeleteFileClick = file => {
    // eslint-disable-next-line no-console
    console.log('Delete file: ', file.name);
  };

  const handlePreviewFileClick = file => {
    // eslint-disable-next-line no-console
    console.log('Preview file: ', file.name);
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
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
        <hr />
        <h1>File Grid viewer</h1>
        <FilesGridViewer
          files={files}
          canDelete
          canNavigateToParent
          onFileClick={handleFileClick}
          onDeleteClick={handleDeleteFileClick}
          onPreviewClick={handlePreviewFileClick}
          onSelectionChange={handleFileSelectionChange}
          onNavigateToParentClick={handleNavigateToParentClick}
          />
        <hr />
        <h1>File List viewer</h1>
        <FilesListViewer
          files={files}
          canDelete
          canNavigateToParent
          onDeleteClick={handleDeleteFileClick}
          onPreviewClick={handlePreviewFileClick}
          onSelectionChange={handleFileSelectionChange}
          onNavigateToParentClick={handleNavigateToParentClick}
          />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;

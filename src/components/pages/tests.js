import PropTypes from 'prop-types';
import FilePreview from '../file-preview.js';
import FilesGridViewer from '../files-grid-viewer.js';
import { getPathSegments } from '../../ui/path-helper.js';
import React, { useCallback, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';
import FilesListViewer from '../files-list-viewer.js';

function Tests({ PageTemplate }) {
  const [files, setFiles] = useState([]);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const convertCdnObjectsToFileRecords = useCallback(objects => {
    return objects.map(obj => {
      const isDirectory = !obj.name;
      const path = obj.name || obj.prefix;
      const segments = getPathSegments(path);
      const name = segments[segments.length - 1];

      return { name, path, size: obj.size, lastModified: obj.lastModified, isDirectory };
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { objects } = await storageApiClient.getObjects('rooms/hZ8U4z5jf1d2cu23U8oPmV/media/');
      setFiles(convertCdnObjectsToFileRecords(objects));
    })();
  }, [storageApiClient, convertCdnObjectsToFileRecords]);

  const handleFileClick = file => {
    // eslint-disable-next-line no-alert
    alert(`Clicked file '${file.name}'`);
  };

  const handleNavigateToParent = () => {
    // eslint-disable-next-line no-alert
    alert('Clicked "navigate to parent"');
  };

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>File preview</h1>
        <h6>IMAGE (Raster)</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/mDCkjepG3D61cX4FNBQxts/monteverdi-ninfa-x2mmMBkoJjnRvGghHQDPaQ.jpg"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>IMAGE (Vector)</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-cEwMkaVH1gREuT3j2NL4mt.svg"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>AUDIO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/7nNYLdkpwLSi7i44qhBpqE/kanon-quintfall-1-2tcutSeJZftuDjiwmVeE47.mp3"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>VIDEO</h6>
        <FilePreview
          url="https://cdn.openmusic.academy/media/rRsbyWevSf5k8bRzvL6N8q/Basis%C3%BCbung%20F-Dur_2pJv5pTWv2B5yELgMUoJyB.mp4"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>PDF</h6>
        <FilePreview
          url="https://upload.wikimedia.org/wikipedia/commons/b/b5/Romanorum_pontificum.pdf"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h6>GENERIC</h6>
        <FilePreview
          url="https://non.existent.com/file.backup"
          lastModified={new Date('2022-03-04T09:48:46.524Z')}
          size={44722}
          />
        <hr />
        <h1>File Grid viewer</h1>
        <FilesGridViewer
          files={files}
          canNavigateToParent
          onFileClick={handleFileClick}
          onNavigateToParent={handleNavigateToParent}
          />
        <hr />
        <h1>File List viewer</h1>
        <FilesListViewer
          files={files}
          canNavigateToParent
          onFileClick={handleFileClick}
          onNavigateToParent={handleNavigateToParent}
          />
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;

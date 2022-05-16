import PropTypes from 'prop-types';
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
        <FilesGridViewer
          files={files}
          canNavigateToParent
          onFileClick={handleFileClick}
          onNavigateToParent={handleNavigateToParent}
          />
        <br />
        <br />
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

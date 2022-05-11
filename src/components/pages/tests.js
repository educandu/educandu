import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import FilesGridViewer from '../files-grid-viewer.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import StorageApiClient from '../../api-clients/storage-api-client.js';

function Tests({ PageTemplate }) {
  const [files, setFiles] = useState([]);
  const storageApiClient = useSessionAwareApiClient(StorageApiClient);

  const convertCdnObjectsToRecords = useCallback(objects => {
    return objects.map(obj => {
      const record = {
        path: obj.name,
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
        originalObject: obj
      };

      return record;
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { objects } = await storageApiClient.getObjects('rooms/hZ8U4z5jf1d2cu23U8oPmV/media/');
      setFiles(convertCdnObjectsToRecords(objects));
    })();
  }, [storageApiClient, convertCdnObjectsToRecords]);

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
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;

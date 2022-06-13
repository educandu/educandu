/* eslint-disable no-console */

import PropTypes from 'prop-types';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import FilePreview from '../file-preview.js';
import DebouncedInput from '../debounced-input.js';
import ResourceSelector from '../resource-selector.js';
import { STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

function Tests({ PageTemplate }) {
  const [initialUrl, setInitialUrl] = useState('');
  const [isResourceSelectorModalVisible, setIsResourceSelectorModalVisible] = useState(false);

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>Resource Selector</h1>

        <div style={{ marginBottom: '25px' }}>
          INITIAL URL:
          &nbsp;
          <DebouncedInput value={initialUrl} onChange={setInitialUrl} />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <Button onClick={() => setIsResourceSelectorModalVisible(true)}>Open in modal window</Button>
        </div>
        <Modal
          closable
          width="80%"
          footer={null}
          destroyOnClose
          visible={isResourceSelectorModalVisible}
          onCancel={() => setIsResourceSelectorModalVisible(false)}
          >
          <ResourceSelector
            allowedLocationTypes={[STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private]}
            initialUrl={initialUrl}
            onSelect={() => setIsResourceSelectorModalVisible(false)}
            onCancel={() => setIsResourceSelectorModalVisible(false)}
            />
        </Modal>
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

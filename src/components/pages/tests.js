/* eslint-disable no-console */

import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ResourcePicker from '../resource-picker.js';

function Tests({ PageTemplate }) {
  const [resourceUrl, setResourceUrl] = useState('');

  return (
    <PageTemplate>
      <div className="TestsPage">
        <h1>ResourcePicker</h1>
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr auto' }}>
          <Input
            value={resourceUrl}
            onChange={event => setResourceUrl(event.target.value)}
            />
          <ResourcePicker
            url={resourceUrl}
            onUrlChange={setResourceUrl}
            />
        </div>
      </div>
    </PageTemplate>
  );
}

Tests.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};

export default Tests;

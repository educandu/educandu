import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import { storageLocationShape } from '../ui/default-prop-types.js';

function StorageLocation({ storageLocation, isFullscreen, onEnterFullscreen, onExitFullscreen, onSelect, onCancel }) {
  return (
    <div>
      <h2>Current location</h2>
      <div>{JSON.stringify(storageLocation)}</div>
      <br />
      <div>
        {isFullscreen && <Button onClick={onExitFullscreen}>Exit fullscreen mode</Button>}
        {!isFullscreen && <Button onClick={onEnterFullscreen}>Enter fullscreen mode</Button>}
      </div>
      <br />
      <div>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" onClick={onSelect}>OK</Button>
      </div>
    </div>
  );
}

StorageLocation.propTypes = {
  isFullscreen: PropTypes.bool,
  onCancel: PropTypes.func,
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
  onSelect: PropTypes.func,
  storageLocation: storageLocationShape.isRequired
};

StorageLocation.defaultProps = {
  isFullscreen: false,
  onCancel: () => {},
  onEnterFullscreen: () => {},
  onExitFullscreen: () => {},
  onSelect: () => {}
};

export default StorageLocation;

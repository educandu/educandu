import React from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import ResourceSelector from './resource-selector.js';
import { STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

// This can later be made configurable by individual plugins
// (when we have more locations than just from the public/private CDN).
const allowedLocationTypes = [STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private];

function ResourcePickerDialog({ isVisible, url, onSelect, onClose }) {
  const handleCancel = event => {
    if (!event.key) {
      onClose();
    }
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

  return (
    <Modal
      centered
      width="80%"
      footer={null}
      destroyOnClose
      closable={false}
      visible={isVisible}
      onCancel={handleCancel}
      modalRender={modalRender}
      >
      <ResourceSelector
        allowedLocationTypes={allowedLocationTypes}
        initialUrl={url}
        onSelect={onSelect}
        onCancel={handleCancel}
        />
    </Modal>
  );
}

ResourcePickerDialog.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
  url: PropTypes.string
};

ResourcePickerDialog.defaultProps = {
  onClose: () => { },
  onSelect: () => { },
  url: ''
};

export default ResourcePickerDialog;

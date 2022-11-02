import React from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import ResourceSelector from './resource-selector.js';
import { SOURCE_TYPE } from '../../domain/constants.js';

const allowedSourceTypes = [SOURCE_TYPE.internalPublic, SOURCE_TYPE.internalPrivate, SOURCE_TYPE.wikimediaCommons];

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
        initialUrl={url}
        onSelect={onSelect}
        onCancel={handleCancel}
        allowedSourceTypes={allowedSourceTypes}
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

import React from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import ResourceSelector from './resource-selector.js';
import { SOURCE_TYPE } from '../../domain/constants.js';

function ResourceSelectorDialog({ allowedSourceTypes, isOpen, url, onSelect, onClose }) {
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
      open={isOpen}
      footer={null}
      destroyOnClose
      closable={false}
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

ResourceSelectorDialog.propTypes = {
  allowedSourceTypes: PropTypes.arrayOf(PropTypes.oneOf(Object.values(SOURCE_TYPE))),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
  url: PropTypes.string
};

ResourceSelectorDialog.defaultProps = {
  allowedSourceTypes: Object.values(SOURCE_TYPE),
  onClose: () => { },
  onSelect: () => { },
  url: ''
};

export default ResourceSelectorDialog;

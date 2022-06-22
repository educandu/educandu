import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResourceSelector from './resource-selector.js';
import { STORAGE_LOCATION_TYPE } from '../domain/constants.js';

// This can later be made configurable by individual plugins
// (when we have more locations than just from the public/private CDN).
const allowedLocationTypes = [STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private];

function ResourcePicker({ url, onUrlChange }) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectButtonClick = () => {
    setIsModalVisible(true);
  };

  const handleSelect = newUrl => {
    onUrlChange(newUrl);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

  return (
    <div className="ResourcePicker">
      <Button
        type="primary"
        onClick={handleSelectButtonClick}
        >
        {t('common:select')}
      </Button>
      <Modal
        closable
        centered
        width="80%"
        footer={null}
        destroyOnClose
        visible={isModalVisible}
        modalRender={modalRender}
        bodyStyle={{ maxHeight: 'calc(90vh - 110px)', overflowY: 'auto' }}
        >
        <ResourceSelector
          allowedLocationTypes={allowedLocationTypes}
          initialUrl={url}
          onSelect={handleSelect}
          onCancel={handleCancel}
          />
      </Modal>
    </div>
  );
}

ResourcePicker.propTypes = {
  onUrlChange: PropTypes.func,
  url: PropTypes.string
};

ResourcePicker.defaultProps = {
  onUrlChange: () => {},
  url: ''
};

export default ResourcePicker;

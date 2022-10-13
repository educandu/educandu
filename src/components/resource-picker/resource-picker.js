import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import ResourceSelector from './resource-selector.js';
import { STORAGE_LOCATION_TYPE } from '../../domain/constants.js';

// This can later be made configurable by individual plugins
// (when we have more locations than just from the public/private CDN).
const allowedLocationTypes = [STORAGE_LOCATION_TYPE.public, STORAGE_LOCATION_TYPE.private];

function ResourcePicker({ isOpen, isButtonVisible, url, onUrlChange }) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(isOpen);

  useEffect(() => {
    setIsModalVisible(isOpen);
  }, [isOpen]);

  const handleSelectButtonClick = () => {
    setIsModalVisible(true);
  };

  const handleSelect = newUrl => {
    onUrlChange(newUrl);
    setIsModalVisible(false);
  };

  const handleCancel = event => {
    if (!event.key) {
      setIsModalVisible(false);
    }
  };

  const modalRender = modal => <div onClick={event => event.stopPropagation()}>{modal}</div>;

  return (
    <div>
      {isButtonVisible && (
      <Button
        type="primary"
        onClick={handleSelectButtonClick}
        >
        {t('common:select')}
      </Button>
      )}
      <Modal
        centered
        width="80%"
        footer={null}
        destroyOnClose
        closable={false}
        visible={isModalVisible}
        onCancel={handleCancel}
        modalRender={modalRender}
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
  isButtonVisible: PropTypes.bool,
  isOpen: PropTypes.bool,
  onUrlChange: PropTypes.func,
  url: PropTypes.string
};

ResourcePicker.defaultProps = {
  isButtonVisible: true,
  isOpen: false,
  onUrlChange: () => {},
  url: ''
};

export default ResourcePicker;

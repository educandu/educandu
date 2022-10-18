import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResourcePickerDialog from './resource-picker-dialog.js';

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

  const handleClose = () => {
    setIsModalVisible(false);
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={handleSelectButtonClick}
        >
        {t('common:select')}
      </Button>
      <ResourcePickerDialog
        url={url}
        isVisible={isModalVisible}
        onSelect={handleSelect}
        onClose={handleClose}
        />
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

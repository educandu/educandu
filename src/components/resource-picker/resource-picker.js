import { Button } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResourcePickerDialog from './resource-picker-dialog.js';

function ResourcePicker({ url, disabled, onUrlChange }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleSelect = newUrl => {
    onUrlChange(newUrl);
    setIsModalOpen(false);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Button
        type="primary"
        disabled={disabled}
        onClick={handleSelectButtonClick}
        >
        {t('common:select')}
      </Button>
      <ResourcePickerDialog
        url={url}
        isOpen={isModalOpen}
        onSelect={handleSelect}
        onClose={handleClose}
        />
    </div>
  );
}

ResourcePicker.propTypes = {
  url: PropTypes.string,
  disabled: PropTypes.bool,
  onUrlChange: PropTypes.func
};

ResourcePicker.defaultProps = {
  url: '',
  disabled: false,
  onUrlChange: () => {}
};

export default ResourcePicker;

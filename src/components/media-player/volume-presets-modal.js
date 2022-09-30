import React from 'react';
import { Modal } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function VolumePresetsModal({ volumePresets, isVisible, onOk, onClose }) {
  const { t } = useTranslation('volumePresetsModal');

  const handleOk = () => {
    onOk(volumePresets);
  };

  const handleCancel = () => onClose();

  return (
    <Modal
      title={t('modalTitle')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      maskClosable={false}
      />
  );
}

VolumePresetsModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired
};

export default VolumePresetsModal;

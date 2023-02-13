import PropTypes from 'prop-types';
import { Button, Input, Modal } from 'antd';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import React, { useEffect, useState } from 'react';
import MoveUpIcon from '../icons/general/move-up-icon.js';
import MoveDownIcon from '../icons/general/move-down-icon.js';
import { removeItemAt, swapItemsAt } from '../../utils/array-utils.js';

function VolumePresetsModal({ volumePresets, isOpen, onOk, onClose }) {
  const { t } = useTranslation('volumePresetsModal');

  const [isDirty, setIsDirty] = useState(false);
  const [managedVolumePresets, setManagedVolumePresets] = useState(volumePresets);

  useEffect(() => {
    setManagedVolumePresets(volumePresets);
  }, [isOpen, volumePresets]);

  const handleOk = () => {
    onOk(isDirty, isDirty ? managedVolumePresets : null);
  };

  const handleCancel = () => {
    onClose();
  };

  const handleNameChange = (event, index) => {
    const { value } = event.target;
    setManagedVolumePresets(oldPresets => {
      const newPresets = cloneDeep(oldPresets);
      newPresets[index].name = value.trim();
      return newPresets;
    });
    setIsDirty(true);
  };

  const handleMoveUpClick = index => {
    setManagedVolumePresets(oldPresets => swapItemsAt(oldPresets, index, index - 1));
    setIsDirty(true);
  };

  const handleMoveDownClick = index => {
    setManagedVolumePresets(oldPresets => swapItemsAt(oldPresets, index, index + 1));
    setIsDirty(true);
  };

  const handleAddClick = () => {
    setManagedVolumePresets(oldPresets => [
      ...oldPresets,
      {
        name: '',
        tracks: Array.from({ length: volumePresets[0].tracks.length }, () => 1)
      }
    ]);
    setIsDirty(true);
  };

  const handleDeleteClick = index => {
    setManagedVolumePresets(oldPresets => removeItemAt(oldPresets, index));
    setIsDirty(true);
  };

  const renderVolumePreset = (preset, index) => {
    return (
      <div key={index} className="VolumePresetsModal">
        <Button
          icon={<MoveUpIcon />}
          disabled={index === 0}
          onClick={() => handleMoveUpClick(index)}
          />
        <Button
          icon={<MoveDownIcon />}
          onClick={() => handleMoveDownClick(index)}
          disabled={index === (managedVolumePresets.length - 1)}
          />
        <Input
          value={preset.name}
          status={preset.name ? null : 'error'}
          onChange={event => handleNameChange(event, index)}
          />
        <DeleteButton
          onClick={() => handleDeleteClick(index)}
          disabled={managedVolumePresets.length === 1}
          />
      </div>
    );
  };

  const isModalOkButtonDisable = managedVolumePresets.some(preset => !preset.name.trim());

  return (
    <Modal
      title={t('modalTitle')}
      open={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('common:cancel')}
        </Button>,
        <Button key="ok" type="primary" disabled={isModalOkButtonDisable} onClick={handleOk}>
          {t('common:ok')}
        </Button>
      ]}
      >
      <div className="u-modal-body">
        {managedVolumePresets.map(renderVolumePreset)}
        <Button onClick={handleAddClick} type="primary" shape="circle" icon={<PlusOutlined />} />
      </div>
    </Modal>
  );
}

VolumePresetsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOk: PropTypes.func.isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    tracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired
};

export default VolumePresetsModal;

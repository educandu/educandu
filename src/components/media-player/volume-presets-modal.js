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

function VolumePresetsModal({ volumePresets, isVisible, onOk, onClose }) {
  const { t } = useTranslation('volumePresetsModal');

  const [isDirty, setIsDirty] = useState(false);
  const [managedVolumePresets, setManagedVolumePresets] = useState(volumePresets);

  useEffect(() => {
    setManagedVolumePresets(volumePresets);
  }, [isVisible, volumePresets]);

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
      newPresets[index].name = value;
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
        name: `[${t('common:name')}]`,
        mainTrack: 1,
        secondaryTracks: new Array(volumePresets[0].secondaryTracks.length).fill(1)
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
          onChange={event => handleNameChange(event, index)}
          />
        <DeleteButton
          onClick={() => handleDeleteClick(index)}
          disabled={managedVolumePresets.length === 1}
          />
      </div>
    );
  };

  return (
    <Modal
      title={t('modalTitle')}
      visible={isVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      >
      {managedVolumePresets.map(renderVolumePreset)}
      <Button onClick={handleAddClick} type="primary" shape="circle" icon={<PlusOutlined />} />
    </Modal>
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
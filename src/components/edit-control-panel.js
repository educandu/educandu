import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import ControlPanel from './control-panel.js';
import { useTranslation } from 'react-i18next';
import SaveIcon from './icons/general/save-icon.js';
import EditIcon from './icons/general/edit-icon.js';
import CloseIcon from './icons/general/close-icon.js';
import EditDocIcon from './icons/multi-color/edit-doc-icon.js';
import { CloudOutlined, CloudUploadOutlined, WarningOutlined } from '@ant-design/icons';

export const EDIT_CONTROL_PANEL_STATUS = {
  saved: 'saved',
  dirty: 'dirty',
  invalid: 'invalid',
  none: 'none'
};

function EditControlPanel({
  startOpen,
  canCancel,
  canClose,
  metadata,
  onOpen,
  onMetadataOpen,
  onSave,
  onCancel,
  onClose,
  status
}) {
  const { t } = useTranslation('editControlPanel');

  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => onOpen();

  const handleClose = () => onClose();

  const handleCancel = () => onCancel();

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  const renderStatusIcon = () => {
    switch (status) {
      case EDIT_CONTROL_PANEL_STATUS.saved:
        return (
          <Tooltip title={t('statusIconTooltipSaved')}>
            <CloudOutlined
              className="EditControlPanel-statusIcon EditControlPanel-statusIcon--saved"
              />
          </Tooltip>
        );
      case EDIT_CONTROL_PANEL_STATUS.dirty:
        return (
          <Tooltip title={t('statusIconTooltipDirty')}>
            <CloudUploadOutlined
              className="EditControlPanel-statusIcon EditControlPanel-statusIcon--dirty"
              />
          </Tooltip>
        );
      case EDIT_CONTROL_PANEL_STATUS.invalid:
        return (
          <Tooltip title={t('statusIconTooltipInvalid')}>
            <WarningOutlined
              className="EditControlPanel-statusIcon EditControlPanel-statusIcon--invalid"
              />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const renderMetadata = () => metadata && (
    <span className="EditControlPanel-leftSide">
      <span className="EditControlPanel-leftSideButton">
        <Tooltip title={t('editMetadata')} placement="topLeft">
          <Button size="small" icon={<EditIcon />} onClick={onMetadataOpen} ghost />
        </Tooltip>
      </span>
      {metadata}
    </span>
  );

  const renderButtons = () => (
    <div className="EditControlPanel-rightSide">
      {renderStatusIcon()}

      <Button
        ghost
        size="small"
        loading={isSaving}
        onClick={handleSave}
        icon={<SaveIcon />}
        className="EditControlPanel-rightSideButton"
        disabled={status !== EDIT_CONTROL_PANEL_STATUS.dirty}
        >
        {t('common:save')}
      </Button>

      {canCancel && (
        <Button
          ghost
          size="small"
          onClick={handleCancel}
          icon={<CloseIcon />}
          className="EditControlPanel-rightSideButton"
          disabled={status === EDIT_CONTROL_PANEL_STATUS.saved}
          >
          {t('common:cancel')}
        </Button>
      )}
    </div>
  );

  return (
    <ControlPanel
      className="EditControlPanel"
      startOpen={startOpen}
      openIcon={<EditDocIcon />}
      openIconPositionFromRight={1}
      canClose={canClose}
      onOpen={handleOpen}
      onClose={handleClose}
      leftSideContent={renderMetadata()}
      rightSideContent={renderButtons()}
      />
  );
}

EditControlPanel.propTypes = {
  canCancel: PropTypes.bool,
  canClose: PropTypes.bool,
  metadata: PropTypes.node,
  onCancel: PropTypes.func,
  onClose: PropTypes.func,
  onMetadataOpen: PropTypes.func,
  onOpen: PropTypes.func,
  onSave: PropTypes.func,
  startOpen: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(EDIT_CONTROL_PANEL_STATUS))
};

EditControlPanel.defaultProps = {
  canCancel: true,
  canClose: true,
  metadata: null,
  onCancel: () => {},
  onClose: () => Promise.resolve(true),
  onMetadataOpen: () => {},
  onOpen: () => Promise.resolve(),
  onSave: () => {},
  startOpen: false,
  status: EDIT_CONTROL_PANEL_STATUS.none
};

export default EditControlPanel;

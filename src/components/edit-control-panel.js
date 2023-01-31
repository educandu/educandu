import PropTypes from 'prop-types';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import ControlPanel from './control-panel.js';
import { useTranslation } from 'react-i18next';
import SaveIcon from './icons/general/save-icon.js';
import EditIcon from './icons/general/edit-icon.js';
import { useBeforeunload } from 'react-beforeunload';
import EditDocIcon from './icons/multi-color/edit-doc-icon.js';
import { CloudOutlined, CloudUploadOutlined } from '@ant-design/icons';

function EditControlPanel({
  startOpen,
  disabled,
  isDirtyState,
  canEditMetadata,
  tooltipWhenDisabled,
  onOpen,
  onMetadataOpen,
  onSave,
  onClose
}) {
  const { t } = useTranslation('editControlPanel');

  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = () => onOpen();

  const handleClose = () => onClose();

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  useBeforeunload(event => {
    if (isDirtyState) {
      event.preventDefault();
    }
  });

  const renderStatusIcon = () => {
    if (isDirtyState) {
      <Tooltip title={t('statusIconTooltipDirty')} placement="topRight">
        <CloudUploadOutlined
          className="EditControlPanel-statusIcon EditControlPanel-statusIcon--dirty"
          />
      </Tooltip>;
    }
    return (
      <Tooltip title={t('statusIconTooltipSaved')} placement="topRight">
        <CloudOutlined
          className="EditControlPanel-statusIcon EditControlPanel-statusIcon--saved"
          />
      </Tooltip>
    );
  };

  const renderEditMetadataButton = () => (
    <span className="EditControlPanel-leftSide">
      <span className="EditControlPanel-leftSideButton">
        <Tooltip title={canEditMetadata ? null : t('editMetadataDisabledTooltip')}>
          <Button
            ghost
            icon={<EditIcon />}
            disabled={!canEditMetadata}
            className="EditControlPanel-editButton"
            onClick={onMetadataOpen}
            >
            {t('editMetadata')}
          </Button>
        </Tooltip>
      </span>
    </span>
  );

  const renderButtons = () => (
    <div className="EditControlPanel-rightSide">
      <Button
        ghost
        loading={isSaving}
        icon={<SaveIcon />}
        disabled={!isDirtyState}
        className="EditControlPanel-rightSideButton"
        onClick={handleSave}
        >
        {t('common:save')}
      </Button>
      {renderStatusIcon()}
    </div>
  );

  return (
    <ControlPanel
      className="EditControlPanel"
      startOpen={startOpen}
      openIcon={<EditDocIcon />}
      disabled={disabled}
      leftSideContent={renderEditMetadataButton()}
      contentAfterClose={renderButtons()}
      tooltipWhenClosed={t('common:edit')}
      tooltipWhenDisabled={tooltipWhenDisabled}
      onOpen={handleOpen}
      onClose={handleClose}
      />
  );
}

EditControlPanel.propTypes = {
  isDirtyState: PropTypes.bool.isRequired,
  startOpen: PropTypes.bool,
  disabled: PropTypes.bool,
  canEditMetadata: PropTypes.bool,
  tooltipWhenDisabled: PropTypes.string,
  onOpen: PropTypes.func,
  onMetadataOpen: PropTypes.func,
  onSave: PropTypes.func,
  onClose: PropTypes.func
};

EditControlPanel.defaultProps = {
  startOpen: false,
  disabled: false,
  canEditMetadata: false,
  tooltipWhenDisabled: null,
  onMetadataOpen: () => {},
  onOpen: () => Promise.resolve(),
  onSave: () => {},
  onClose: () => Promise.resolve(true)
};

export default EditControlPanel;

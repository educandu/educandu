import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useEffect, useState } from 'react';
import {
  CloseOutlined,
  EditOutlined,
  SaveOutlined,
  CloudOutlined,
  CloudUploadOutlined,
  WarningOutlined,
  UndoOutlined
} from '@ant-design/icons';

export const EDIT_CONTROL_PANEL_STATUS = {
  saved: 'saved',
  dirty: 'dirty',
  invalid: 'invalid',
  none: 'none'
};

function EditControlPanel({ startExpanded, canCancel, canClose, metadata, onEdit, onMetadataEdit, onSave, onCancel, onClose, status }) {
  const { t } = useTranslation('editControlPanel');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!canClose || startExpanded);
  const [isExpandedContentVisible, setIsExpandedContentVisible] = useState(false);

  useEffect(() => {
    if (!canClose || startExpanded) {
      setIsExpandedContentVisible(true);
      return;
    }

    if (isExpanded) {
      setTimeout(() => setIsExpandedContentVisible(true), 500);
    } else {
      setIsExpandedContentVisible(false);
    }
  }, [canClose, startExpanded, isExpanded]);

  const handleEditClick = async () => {
    try {
      setIsLoading(true);
      await onEdit();
      setIsExpanded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    onSave();
  };

  const handleCloseClick = async () => {
    const canBeClosed = await onClose();
    if (canBeClosed) {
      setIsExpanded(false);
    }
  };

  const handleCancelClick = () => {
    onCancel();
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

  const renderExpandedContent = () => {
    return (
      <Fragment>
        <div className="EditControlPanel-metadata">
          { metadata && (
            <Fragment>
              <span className="EditControlPanel-metadataEditButton">
                <Button size="small" icon={<EditOutlined />} onClick={onMetadataEdit} ghost />
              </span>
              {metadata}
            </Fragment>
          )}
        </div>
        <div className="EditControlPanel-buttonGroup">
          {renderStatusIcon()}
          <Button disabled={status !== EDIT_CONTROL_PANEL_STATUS.dirty} className="EditControlPanel-button" size="small" icon={<SaveOutlined />} onClick={handleSaveClick} ghost>{t('common:save')}</Button>
          { canCancel && (
            <Button disabled={status === EDIT_CONTROL_PANEL_STATUS.saved} className="EditControlPanel-button" size="small" icon={<UndoOutlined />} onClick={handleCancelClick} ghost>{t('common:cancel')}</Button>
          )}
          { canClose && (
            <Button className="EditControlPanel-button" size="small" icon={<CloseOutlined />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
          )}
        </div>
      </Fragment>

    );
  };

  const renderCollapsedContent = () => {
    return (
      <Button className="EditControlPanel-penButton" type="link" icon={<EditOutlined />} onClick={handleEditClick} loading={isLoading} />
    );
  };

  return (
    <div className={classNames('EditControlPanel', { 'is-expanded': isExpanded })}>
      {isExpanded && isExpandedContentVisible && renderExpandedContent()}
      {!isExpanded && renderCollapsedContent()}
    </div>
  );
}

EditControlPanel.propTypes = {
  canCancel: PropTypes.bool,
  canClose: PropTypes.bool,
  metadata: PropTypes.node,
  onCancel: PropTypes.func,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onMetadataEdit: PropTypes.func,
  onSave: PropTypes.func,
  startExpanded: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(EDIT_CONTROL_PANEL_STATUS))
};

EditControlPanel.defaultProps = {
  canCancel: true,
  canClose: true,
  metadata: null,
  onCancel: () => {},
  onClose: () => Promise.resolve(true),
  onEdit: () => Promise.resolve(),
  onMetadataEdit: () => {},
  onSave: () => {},
  startExpanded: false,
  status: EDIT_CONTROL_PANEL_STATUS.none
};

export default EditControlPanel;

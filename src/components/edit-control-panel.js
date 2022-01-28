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
  WarningOutlined
} from '@ant-design/icons';

export const EDIT_CONTROL_PANEL_STATUS = {
  saved: 'saved',
  dirty: 'dirty',
  invalid: 'invalid',
  none: 'none'
};

function EditControlPanel({ children, onEdit, onSave, onClose, status }) {
  const { t } = useTranslation('editControlPanel');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandedContentVisible, setIsExpandedContentVisible] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => setIsExpandedContentVisible(true), 500);
    } else {
      setIsExpandedContentVisible(false);
    }
  }, [isExpanded]);

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
    const canClose = await onClose();
    if (canClose) {
      setIsExpanded(false);
    }
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
        <div className="EditControlPanel-children">
          {children}
        </div>
        <div className="EditControlPanel-buttonGroup">
          {renderStatusIcon()}
          <Button disabled={status !== EDIT_CONTROL_PANEL_STATUS.dirty} className="EditControlPanel-button" size="small" icon={<SaveOutlined />} onClick={handleSaveClick} ghost>{t('common:save')}</Button>
          <Button className="EditControlPanel-button" size="small" icon={<CloseOutlined />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
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
  children: PropTypes.node,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  status: PropTypes.oneOf(Object.values(EDIT_CONTROL_PANEL_STATUS))
};

EditControlPanel.defaultProps = {
  children: null,
  onClose: () => {},
  onEdit: () => {},
  onSave: () => {},
  status: EDIT_CONTROL_PANEL_STATUS.none
};

export default EditControlPanel;

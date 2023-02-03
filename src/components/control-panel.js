import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import CloseIcon from './icons/general/close-icon.js';

function ControlPanel({
  startOpen,
  openIcon,
  disabled,
  leftSideContent,
  contentBeforeClose,
  contentAfterClose,
  tooltipWhenClosed,
  tooltipWhenDisabled,
  onOpen,
  onClose
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(startOpen);
  const [isContentVisible, setIsContentVisible] = useState(false);

  const isPanelClosed = !isOpen || !!disabled;
  const isPanelFullyOpen = !disabled && !!isOpen && isContentVisible;

  useEffect(() => {
    if (startOpen) {
      setIsContentVisible(true);
      return;
    }

    if (isOpen) {
      setTimeout(() => setIsContentVisible(true), 500);
    } else {
      setIsContentVisible(false);
    }
  }, [startOpen, isOpen]);

  const handleOpenClick = async () => {
    try {
      setIsLoading(true);
      await onOpen();
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseClick = async () => {
    const canBeClosed = await onClose();
    if (canBeClosed) {
      setIsOpen(false);
    }
  };

  const renderContent = () => {
    return (
      <div className="ControlPanel-content">
        <div className="ControlPanel-contentLeft">
          {leftSideContent}
        </div>
        <div className="ControlPanel-contentRight">
          { contentBeforeClose }
          <Button className="ControlPanel-closeButton" icon={<CloseIcon />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
          { contentAfterClose }
        </div>
      </div>

    );
  };

  const renderOpenButton = () => {
    return (
      <Tooltip title={disabled ? tooltipWhenDisabled : tooltipWhenClosed}>
        <Button
          type="link"
          icon={openIcon}
          disabled={disabled}
          loading={isLoading}
          onClick={handleOpenClick}
          className={classNames('ControlPanel-openButton', { 'is-disabled': disabled })}
          />
      </Tooltip>
    );
  };

  return (
    <div className={classNames('ControlPanel', { 'is-open': isOpen })}>
      {!!isPanelFullyOpen && renderContent()}
      {!!isPanelClosed && renderOpenButton()}
    </div>
  );
}

ControlPanel.propTypes = {
  startOpen: PropTypes.bool,
  openIcon: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  leftSideContent: PropTypes.node,
  contentBeforeClose: PropTypes.node,
  contentAfterClose: PropTypes.node,
  tooltipWhenClosed: PropTypes.string,
  tooltipWhenDisabled: PropTypes.string,
  onOpen: PropTypes.func,
  onClose: PropTypes.func
};

ControlPanel.defaultProps = {
  startOpen: false,
  disabled: false,
  leftSideContent: null,
  contentBeforeClose: null,
  contentAfterClose: null,
  tooltipWhenClosed: null,
  tooltipWhenDisabled: null,
  onOpen: () => Promise.resolve(),
  onClose: () => Promise.resolve(true)
};

export default ControlPanel;

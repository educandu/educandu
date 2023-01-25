import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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
  onOpen,
  onClose
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(startOpen);
  const [isContentVisible, setIsContentVisible] = useState(false);

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
          <Button className="ControlPanel-closeButton" size="small" icon={<CloseIcon />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
          { contentAfterClose }
        </div>
      </div>

    );
  };

  const renderOpenButton = () => {
    return (
      <Button
        type="link"
        icon={openIcon}
        disabled={disabled}
        loading={isLoading}
        onClick={handleOpenClick}
        className="ControlPanel-openButton"
        />
    );
  };

  return (
    <div className={classNames('ControlPanel', { 'is-open': isOpen })}>
      {!!isOpen && !!isContentVisible && renderContent()}
      {(!isOpen || !!disabled) && renderOpenButton()}
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
  onOpen: PropTypes.func,
  onClose: PropTypes.func
};

ControlPanel.defaultProps = {
  startOpen: false,
  disabled: false,
  leftSideContent: null,
  contentBeforeClose: null,
  contentAfterClose: null,
  onOpen: () => Promise.resolve(),
  onClose: () => Promise.resolve(true)
};

export default ControlPanel;

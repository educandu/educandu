import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import CloseIcon from './icons/general/close-icon.js';

function ControlPanel({
  startOpen,
  openIcon,
  openIconPositionFromRight,
  canClose,
  onOpen,
  onClose,
  leftSideContent,
  rightSideContent
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(!canClose || startOpen);
  const [isContentVisible, setIsContentVisible] = useState(false);

  useEffect(() => {
    if (!canClose || startOpen) {
      setIsContentVisible(true);
      return;
    }

    if (isOpen) {
      setTimeout(() => setIsContentVisible(true), 500);
    } else {
      setIsContentVisible(false);
    }
  }, [canClose, startOpen, isOpen]);

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
          { rightSideContent }
          { canClose && (
            <Button className="ControlPanel-closeButton" size="small" icon={<CloseIcon />} onClick={handleCloseClick} ghost>{t('common:close')}</Button>
          )}
        </div>
      </div>

    );
  };

  const renderOpenButton = () => {
    return (
      <Button className="ControlPanel-openButton" type="link" icon={openIcon} onClick={handleOpenClick} loading={isLoading} />
    );
  };

  return (
    <div className={classNames('ControlPanel', `ControlPanel--position${openIconPositionFromRight}`, { 'is-open': isOpen })}>
      {isOpen && isContentVisible && renderContent()}
      {!isOpen && renderOpenButton()}
    </div>
  );
}

ControlPanel.propTypes = {
  canClose: PropTypes.bool,
  leftSideContent: PropTypes.node,
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  openIcon: PropTypes.node.isRequired,
  openIconPositionFromRight: PropTypes.oneOf([1, 2]),
  rightSideContent: PropTypes.node,
  startOpen: PropTypes.bool
};

ControlPanel.defaultProps = {
  canClose: true,
  leftSideContent: null,
  onClose: () => Promise.resolve(true),
  onOpen: () => Promise.resolve(),
  openIconPositionFromRight: 1,
  rightSideContent: null,
  startOpen: false
};

export default ControlPanel;

import React from 'react';
import PropTypes from 'prop-types';
import ControlPanel from './control-panel.js';
import { HistoryOutlined } from '@ant-design/icons';

function HistoryControlPanel({
  startOpen,
  onOpen,
  onClose
}) {
  const handleOpen = () => onOpen();

  const handleClose = () => onClose();

  return (
    <ControlPanel
      className="HistoryControlPanel"
      startOpen={startOpen}
      openIcon={<HistoryOutlined />}
      openIconPosition={1}
      canClose
      onOpen={handleOpen}
      onClose={handleClose}
      leftSideContent={null}
      rightSideContent={null}
      />
  );
}

HistoryControlPanel.propTypes = {
  onClose: PropTypes.func,
  onOpen: PropTypes.func,
  startOpen: PropTypes.bool
};

HistoryControlPanel.defaultProps = {
  onClose: () => Promise.resolve(true),
  onOpen: () => Promise.resolve(),
  startOpen: false
};

export default HistoryControlPanel;

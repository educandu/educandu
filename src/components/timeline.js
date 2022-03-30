import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeleteIcon from './icons/general/delete-icon.js';
import React, { useCallback, useEffect, useState } from 'react';
import { FlagOutlined } from '@ant-design/icons';

const MIN_PART_LENGTH_IN_MS = 1000;

function Timeline({ length, parts, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const [dragState, setDragState] = useState(null);
  const handlePartDelete = key => () => onPartDelete(key);

  const handleMouseDown = (part, index) => () => {
    setDragState(part);
    const previousPart = parts[index - 1];
    const nextPart = parts[index + 1];

    const elementBounds = document.getElementById(part.key).getBoundingClientRect();
    const previousElementBounds = document.getElementById(previousPart.key).getBoundingClientRect();
    const maxBoundsInMs = { left: previousPart.startTimecode, right: nextPart?.startTimecode || length };
    const maxBoundsInPx = { left: previousElementBounds.left, right: elementBounds.right };

    const msToPxRatio = maxBoundsInPx.right / maxBoundsInMs.right;
    const minPartLengthInPx = MIN_PART_LENGTH_IN_MS * msToPxRatio;

    const boundsInPx = { left: maxBoundsInPx.left + minPartLengthInPx, right: maxBoundsInPx.right - minPartLengthInPx };

    setDragState({ part, boundsInPx, msToPxRatio });
  };

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleMouseMove = useCallback(event => {
    if (dragState.boundsInPx.left <= event.clientX && event.clientX <= dragState.boundsInPx.right) {
      const newStartTimecode = event.clientX / dragState.msToPxRatio;
      onStartTimecodeChange(dragState.part.key, newStartTimecode);
    }
  }, [dragState, onStartTimecodeChange]);

  useEffect(() => {
    if (!dragState) {
      return () => {};
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  const renderPart = (part, index) => {
    const nextPart = parts[index + 1];
    const stopTimecode = nextPart ? nextPart.startTimecode : length;
    const width = ((stopTimecode - part.startTimecode) * 100) / length;

    return (
      <div key={part.key} id={part.key} className="Timeline-part" style={{ width: `${width}%` }}>
        <div className="Timeline-partFlagsBar">
          {index > 0 && <div className="Timeline-partStartFlag" onMouseDown={handleMouseDown(part, index)}><FlagOutlined /></div>}
        </div>
        <div className="Timeline-partTrackBar">{part.title}</div>
        <div className="Timeline-partDeleteBar">
          <Button
            className="Timeline-partDeleteBarButton"
            type="link"
            icon={<DeleteIcon />}
            onClick={handlePartDelete(part.key)}
            disabled={parts.length === 1}
            />
        </div>
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })}>
      {parts.map(renderPart)}
    </div>
  );
}

Timeline.propTypes = {
  length: PropTypes.number.isRequired,
  onPartAdd: PropTypes.func,
  onPartDelete: PropTypes.func,
  onStartTimecodeChange: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    startTimecode: PropTypes.number.isRequired
  })).isRequired
};

Timeline.defaultProps = {
  onPartAdd: () => {},
  onPartDelete: () => {},
  onStartTimecodeChange: () => {}
};

export default Timeline;

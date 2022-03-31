import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FlagOutlined } from '@ant-design/icons';
import DeleteIcon from './icons/general/delete-icon.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_DURATION_IN_MS = 1000;

function Timeline({ length, parts, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const timelineRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [msToPxRatio, setMsToPxRatio] = useState(0);
  const [timelineBounds, setTimelineBounds] = useState({});

  const handlePartDelete = key => () => onPartDelete(key);

  const handleMouseDown = (marker, index) => () => {
    const prevMarker = markers[index - 1];
    const nextMarker = markers[index + 1];

    const minPartLength = MIN_PART_DURATION_IN_MS * msToPxRatio;
    const bounds = {
      left: (prevMarker?.left || 0) + minPartLength,
      right: (nextMarker?.left || timelineBounds.width) - minPartLength
    };

    setDragState({ marker, bounds });
  };

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleMouseMove = useCallback(event => {
    // Disable text selection
    event.preventDefault();

    const currentLeft = event.clientX - timelineBounds.left;
    const marker = markers.find(m => m.key === dragState.marker.key);

    if (dragState.bounds.left > currentLeft && dragState.bounds.left !== marker.left) {
      marker.left = dragState.bounds.left;
    }
    if (dragState.bounds.left <= currentLeft && currentLeft <= dragState.bounds.right) {
      marker.left = currentLeft;
    }
    if (currentLeft > dragState.bounds.right && dragState.bounds.left !== marker.left) {
      marker.left = dragState.bounds.right;
    }

    setDragState(prev => ({ ...prev, marker }));

    const newStartTimecode = dragState.marker.left / msToPxRatio;
    onStartTimecodeChange(dragState.marker.key, newStartTimecode);
  }, [dragState, markers, timelineBounds, msToPxRatio, onStartTimecodeChange]);

  useEffect(() => {
    if (!dragState) {
      return () => { };
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

    const newRatio = timelineRef.current.clientWidth / length;
    const newTimelineBounds = timelineRef.current.getBoundingClientRect();
    const newMarkers = parts.slice(1).map(part => ({ key: part.key, left: part.startTimecode * newRatio }));

    const newSegments = parts.map((part, index) => {
      const segment = { key: part.key, title: part.title };

      if (parts.length === 1) {
        segment.width = newTimelineBounds.width;
        return segment;
      }
      if (index === 0) {
        segment.width = newMarkers[index].left;
        return segment;
      }
      if (index === parts.length - 1) {
        segment.width = newTimelineBounds.width - newMarkers[index - 1].left;
        return segment;
      }
      segment.width = newMarkers[index].left - newMarkers[index - 1].left;
      return segment;
    });

    setMarkers(newMarkers);
    setMsToPxRatio(newRatio);
    setSegments(newSegments);
    setTimelineBounds(newTimelineBounds);
  }, [timelineRef, parts, length]);

  const renderMarker = (marker, index) => {
    return (
      <div key={marker.key} id={marker.key} className="Timeline-marker" style={{ left: `${marker.left}px` }}>
        <div className="Timeline-partFlagsBar" onMouseDown={handleMouseDown(marker, index)}>
          <FlagOutlined />
        </div>
      </div>
    );
  };

  const renderSegment = segment => (
    <div key={segment.key} className="Timeline-segment" style={{ width: `${segment.width}px` }}>{segment.title}</div>
  );

  const renderDeleteSegment = segment => {
    return segment.width >= MIN_PART_WIDTH_IN_PX && (
      <div key={segment.key} className="Timeline-deleteSegment" style={{ width: `${segment.width}px` }}>
        <Button
          className="Timeline-deleteButton"
          type="link"
          icon={<DeleteIcon />}
          onClick={handlePartDelete(segment.key)}
          disabled={segments.length === 1}
          />
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })} ref={timelineRef}>
      <div className={classNames('Timeline-markersBar')}>
        {markers.map(renderMarker)}
      </div>
      <div className={classNames('Timeline-segmentsBar')}>
        {segments.map(renderSegment)}
      </div>
      <div className={classNames('Timeline-deletionBar')}>
        {segments.map(renderDeleteSegment)}
      </div>
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
  onPartAdd: () => { },
  onPartDelete: () => { },
  onStartTimecodeChange: () => { }
};

export default Timeline;

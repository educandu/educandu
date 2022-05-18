import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FlagOutlined } from '@ant-design/icons';
import CloseIcon from './icons/general/close-icon.js';
import DeleteIcon from './icons/general/delete-icon.js';
import { isTouchDevice } from '../ui/browser-helper.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_DURATION_IN_MS = 1000;

function Timeline({ length, parts, selectedPartIndex, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const timelineRef = useRef(null);

  const [dragState, setDragState] = useState(null);
  const [newMarkerState, setNewMarkerState] = useState(null);
  const [newMarkerBounds, setNewMarkerBounds] = useState([]);
  const [timelineState, setTimelineState] = useState({ markers: [], segments: [], msToPxRatio: 0 });

  const handleSegmentDelete = key => () => onPartDelete(key);

  const handleMarkerMouseDown = (marker, index) => () => {
    const prevMarker = timelineState.markers[index - 1];
    const nextMarker = timelineState.markers[index + 1];
    const timelineBounds = timelineRef.current.getBoundingClientRect();

    const bounds = {
      left: (prevMarker?.left || 0) + timelineState.minSegmentLength,
      right: (nextMarker?.left || timelineBounds.width) - timelineState.minSegmentLength
    };

    setDragState({ marker, bounds });
  };

  const handleWindowMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleWindowMouseMove = useCallback(event => {
    // Disable selection of DOM elements (e.g. text, image)
    event.preventDefault();
    const timelineBounds = timelineRef.current.getBoundingClientRect();

    const currentLeft = event.clientX - timelineBounds.left;
    const marker = timelineState.markers.find(m => m.key === dragState.marker.key);

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

    const newStartTimecode = Math.round(dragState.marker.left / timelineState.msToPxRatio);
    onStartTimecodeChange(dragState.marker.key, newStartTimecode);
  }, [dragState, timelineState, onStartTimecodeChange]);

  const handleSegmentsBarClick = () => {
    if (isTouchDevice()) {
      return;
    }

    if (newMarkerState?.isInBounds) {
      const startTimecode = Math.round(newMarkerState.left / timelineState.msToPxRatio);
      setNewMarkerState(null);
      onPartAdd(startTimecode);
    }
  };

  const handleSegmentsBarMouseLeave = () => {
    setNewMarkerState(null);
  };

  const handleSegmentsBarMouseMove = event => {
    if (dragState || isTouchDevice()) {
      return;
    }
    const timelineBounds = timelineRef.current.getBoundingClientRect();

    const timelineBarHeight = timelineBounds.height / 3;
    const segmentsBarMinTop = timelineBounds.top + timelineBarHeight;
    const segmentsBarMaxTop = timelineBounds.top + (timelineBarHeight * 2);

    const isExceedingVerticalBounds = event.clientY > segmentsBarMaxTop || event.clientY < segmentsBarMinTop;
    if (isExceedingVerticalBounds) {
      handleSegmentsBarMouseLeave();
      return;
    }

    const currentLeft = event.clientX - timelineBounds.left;
    const isInBounds = newMarkerBounds.some(bounds => bounds.leftMin <= currentLeft && currentLeft <= bounds.leftMax);
    setNewMarkerState({ left: currentLeft, isInBounds });
  };

  const updateStates = useCallback(() => {
    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const msToPxRatio = timelineRef.current.clientWidth / length;
    const minSegmentLength = MIN_PART_DURATION_IN_MS * msToPxRatio;
    const markers = parts.slice(1).map(part => ({ key: part.key, left: part.startTimecode * msToPxRatio }));

    const segments = parts.map((part, index) => {
      const segment = { key: part.key, title: part.title };

      if (parts.length === 1) {
        segment.width = timelineBounds.width;
        return segment;
      }
      if (index === 0) {
        segment.width = markers[index].left;
        return segment;
      }
      if (index === parts.length - 1) {
        segment.width = timelineBounds.width - markers[index - 1].left;
        return segment;
      }
      segment.width = markers[index].left - markers[index - 1].left;
      return segment;
    });

    const markerBounds = parts.map((part, index) => {
      const nextPartStartTimecode = parts[index + 1]?.startTimecode || length;
      const currentPartDuration = nextPartStartTimecode - part.startTimecode;

      if (currentPartDuration <= MIN_PART_DURATION_IN_MS) {
        return null;
      }

      let leftMin = (part.startTimecode * msToPxRatio) + minSegmentLength;
      let leftMax = (nextPartStartTimecode * msToPxRatio) - minSegmentLength;
      const thereIsAlmostAPixelLeft = (leftMax - leftMin) <= 0;

      if (thereIsAlmostAPixelLeft) {
        leftMin -= 0.5;
        leftMax += 0.5;
      }
      return { leftMin, leftMax };
    }).filter(bound => bound);

    setNewMarkerBounds(markerBounds);
    setTimelineState({ markers, segments, msToPxRatio, minSegmentLength });
  }, [parts, length]);

  useEffect(() => {
    if (timelineRef.current) {
      updateStates();
    }
  }, [timelineRef, updateStates]);

  useEffect(() => {
    window.addEventListener('resize', updateStates);
    return () => {
      window.removeEventListener('resize', updateStates);
    };
  }, [updateStates]);

  useEffect(() => {
    if (!dragState || isTouchDevice()) {
      return () => { };
    }
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, handleWindowMouseMove, handleWindowMouseUp]);

  const renderExistingMarker = (marker, index) => {
    return (
      <div key={marker.key} className="Timeline-marker Timeline-marker--draggable" style={{ left: `${marker.left}px` }}>
        <FlagOutlined onMouseDown={handleMarkerMouseDown(marker, index)} />
      </div>
    );
  };

  const renderNewMarker = () => {
    const offset = newMarkerState.isInBounds ? 0 : -5;
    return (
      <div key="new-marker" className="Timeline-marker Timeline-marker--new" style={{ left: `${newMarkerState.left + offset}px` }}>
        <div className={`Timeline-markerTimecode ${newMarkerState.isInBounds ? 'Timeline-markerTimecode--valid' : 'Timeline-markerTimecode--invalid'}`}>
          {formatMillisecondsAsDuration(Math.round(newMarkerState.left / timelineState.msToPxRatio))}
        </div>
        {newMarkerState.isInBounds && <FlagOutlined />}
        {!newMarkerState.isInBounds && <CloseIcon />}
      </div>
    );
  };

  const renderSegment = (segment, index) => {
    const classes = classNames('Timeline-segment', { 'is-selected': index === selectedPartIndex });
    return (
      <div key={segment.key} className={classes} style={{ width: `${segment.width}px` }}>{segment.title}</div>
    );
  };

  const renderDeleteSegment = segment => {
    return (
      <div key={segment.key} className="Timeline-deleteSegment" style={{ width: `${segment.width}px` }}>
        {segment.width >= MIN_PART_WIDTH_IN_PX && (
          <Button
            className="Timeline-deleteButton"
            type="link"
            icon={<DeleteIcon />}
            onClick={handleSegmentDelete(segment.key)}
            disabled={timelineState.segments.length === 1}
            />
        )}
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })} ref={timelineRef}>
      <div className="Timeline-markersBar">
        {timelineState.markers.map(renderExistingMarker)}
        {!!newMarkerState && renderNewMarker()}
      </div>
      <div
        className="Timeline-segmentsBar"
        onClick={handleSegmentsBarClick}
        onMouseMove={handleSegmentsBarMouseMove}
        onMouseLeave={handleSegmentsBarMouseLeave}
        >
        {!!newMarkerState && <div className="Timeline-newSegmentStart" style={{ left: `${newMarkerState.left}px` }} />}
        {timelineState.segments.map(renderSegment)}
      </div>
      <div className="Timeline-deletionBar">
        {timelineState.segments.map(renderDeleteSegment)}
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
  })).isRequired,
  selectedPartIndex: PropTypes.number
};

Timeline.defaultProps = {
  onPartAdd: () => { },
  onPartDelete: () => { },
  onStartTimecodeChange: () => { },
  selectedPartIndex: -1
};

export default Timeline;

import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FlagOutlined } from '@ant-design/icons';
import CloseIcon from '../icons/general/close-icon.js';
import { useNumberFormat } from '../locale-context.js';
import DeleteIcon from '../icons/general/delete-icon.js';
import { isTouchDevice } from '../../ui/browser-helper.js';
import { getContrastColor } from '../../ui/color-helper.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ensureValidMediaPosition, formatMediaPosition } from '../../utils/media-utils.js';

const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_FRACTION_IN_PERCENTAGE = 0.005;

function Timeline({ durationInMilliseconds, parts, selectedPartIndex, onPartAdd, onPartDelete, onStartPositionChange }) {
  const timelineRef = useRef(null);
  const { formatPercentage } = useNumberFormat();

  const [dragState, setDragState] = useState(null);
  const [newMarkerState, setNewMarkerState] = useState(null);
  const [newMarkerBounds, setNewMarkerBounds] = useState([]);
  const [timelineState, setTimelineState] = useState({ markers: [], segments: [], currentTimelineWidth: 0 });

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
    if (!timelineState.currentTimelineWidth) {
      return;
    }

    // Disable selection of DOM elements (e.g. text, image)
    event.preventDefault();
    const timelineBounds = timelineRef.current.getBoundingClientRect();

    const currentLeft = event.clientX - timelineBounds.left;
    const marker = { ...timelineState.markers.find(m => m.key === dragState.marker.key) };

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
    setTimelineState(prev => ({
      ...prev,
      markers: prev.markers.map(prevMarker => prevMarker.key === marker.key ? marker : prevMarker)
    }));

    const newStartPosition = ensureValidMediaPosition(dragState.marker.left / timelineState.currentTimelineWidth);
    onStartPositionChange(dragState.marker.key, newStartPosition);
  }, [dragState, timelineState, onStartPositionChange]);

  const handleSegmentsBarClick = () => {
    if (!timelineState.currentTimelineWidth || isTouchDevice()) {
      return;
    }

    if (newMarkerState?.isInBounds) {
      const startPosition = ensureValidMediaPosition(newMarkerState.left / timelineState.currentTimelineWidth);
      setNewMarkerState(null);
      onPartAdd(startPosition);
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
    const currentTimelineWidth = timelineRef.current.clientWidth;
    const minSegmentWidth = Math.max(1, MIN_PART_FRACTION_IN_PERCENTAGE * currentTimelineWidth);
    const markers = parts.slice(1).map(part => ({ key: part.key, left: part.startPosition * currentTimelineWidth }));

    const segments = parts.map((part, index) => {
      const segment = { key: part.key, title: part.title, color: part.color };

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
      const nextPartStartPosition = parts[index + 1]?.startPosition || 1;
      const currentPartFraction = nextPartStartPosition - part.startPosition;

      if (currentPartFraction <= MIN_PART_FRACTION_IN_PERCENTAGE) {
        return null;
      }

      let leftMin = (part.startPosition * currentTimelineWidth) + minSegmentWidth;
      let leftMax = (nextPartStartPosition * currentTimelineWidth) - minSegmentWidth;
      const thereIsAlmostAPixelLeft = (leftMax - leftMin) <= 0;

      if (thereIsAlmostAPixelLeft) {
        leftMin -= 0.5;
        leftMax += 0.5;
      }
      return { leftMin, leftMax };
    }).filter(bound => bound);

    setNewMarkerBounds(markerBounds);
    setTimelineState({ markers, segments, currentTimelineWidth, minSegmentLength: minSegmentWidth });
  }, [parts]);

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
      return () => {};
    }
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragState, handleWindowMouseMove, handleWindowMouseUp]);

  const renderExistingMarker = (marker, index) => {
    const percentage = marker.left / timelineState.currentTimelineWidth;
    const markerText = formatMediaPosition({ position: percentage, duration: durationInMilliseconds, formatPercentage });

    return (
      <div key={marker.key} className="Timeline-marker Timeline-marker--draggable" style={{ left: `${marker.left}px` }}>
        {!!dragState && (
          <div className="Timeline-markerTimecode">{markerText}</div>
        )}
        <FlagOutlined onMouseDown={handleMarkerMouseDown(marker, index)} />
      </div>
    );
  };

  const renderNewMarker = () => {
    if (!timelineState.currentTimelineWidth) {
      return null;
    }

    const offset = newMarkerState.isInBounds ? 0 : -5;
    const percentage = newMarkerState.left / timelineState.currentTimelineWidth;
    const markerText = formatMediaPosition({ position: percentage, duration: durationInMilliseconds, formatPercentage });

    return (
      <div key="new-marker" className="Timeline-marker Timeline-marker--new" style={{ left: `${newMarkerState.left + offset}px` }}>
        <div className={`Timeline-markerTimecode ${newMarkerState.isInBounds ? 'Timeline-markerTimecode--valid' : 'Timeline-markerTimecode--invalid'}`}>
          {markerText}
        </div>
        {newMarkerState.isInBounds && <FlagOutlined />}
        {!newMarkerState.isInBounds && <CloseIcon />}
      </div>
    );
  };

  const renderSegment = (segment, index) => {
    const style = { width: `${segment.width}px` };
    const classes = classNames(
      'Timeline-segment',
      { 'is-selected': index === selectedPartIndex && timelineState.segments.length > 1 }
    );

    if (segment.color) {
      style.backgroundColor = segment.color;
      style.color = getContrastColor(segment.color);
    }

    return (
      <div key={segment.key} className={classes} style={style}>{segment.title}</div>
    );
  };

  const renderDeleteSegment = (segment, index) => {
    const style = { width: `${segment.width}px` };
    const classes = classNames(
      'Timeline-deleteSegment',
      { 'is-selected': index === selectedPartIndex && timelineState.segments.length > 1 }
    );

    return (
      <div key={segment.key} className={classes} style={style}>
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
  durationInMilliseconds: PropTypes.number,
  onPartAdd: PropTypes.func,
  onPartDelete: PropTypes.func,
  onStartPositionChange: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    title: PropTypes.string,
    color: PropTypes.string,
    startPosition: PropTypes.number.isRequired
  })).isRequired,
  selectedPartIndex: PropTypes.number
};

Timeline.defaultProps = {
  durationInMilliseconds: 0,
  onPartAdd: () => { },
  onPartDelete: () => { },
  onStartPositionChange: () => { },
  selectedPartIndex: -1
};

export default Timeline;

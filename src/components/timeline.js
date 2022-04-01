import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FlagOutlined } from '@ant-design/icons';
import CloseIcon from './icons/general/close-icon.js';
import DeleteIcon from './icons/general/delete-icon.js';
import { isTouchDevice } from '../ui/browser-helper.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_DURATION_IN_MS = 1000;

function Timeline({ length, parts, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const timelineRef = useRef(null);

  const [dragState, setDragState] = useState(null);
  const [newMarkerState, setNewMarkerState] = useState(null);
  const [newMarkerBounds, setNewMarkerBounds] = useState([]);
  const [timelineState, setTimelineState] = useState({ markers: [], segments: [], msToPxRatio: 0, bounds: {} });

  const handleSegmentDelete = key => () => onPartDelete(key);

  const handleMarkerMouseDown = (marker, index) => () => {
    const prevMarker = timelineState.markers[index - 1];
    const nextMarker = timelineState.markers[index + 1];

    const bounds = {
      left: (prevMarker?.left || 0) + timelineState.minSegmentLength,
      right: (nextMarker?.left || timelineState.bounds.width) - timelineState.minSegmentLength
    };

    setDragState({ marker, bounds });
  };

  const handleWindowMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleWindowMouseMove = useCallback(event => {
    // Disable selection of DOM elements (e.g. text, image)
    event.preventDefault();

    const currentLeft = event.clientX - timelineState.bounds.left;
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

    const timelineBarHeight = timelineState.bounds.height / 3;
    const segmentsBarMinTop = timelineState.bounds.top + timelineBarHeight;
    const segmentsBarMaxTop = timelineState.bounds.top + (timelineBarHeight * 2);

    const isExceedingVerticalBounds = event.clientY > segmentsBarMaxTop || event.clientY < segmentsBarMinTop;
    if (isExceedingVerticalBounds) {
      handleSegmentsBarMouseLeave();
      return;
    }

    const currentLeft = event.clientX - timelineState.bounds.left;
    const isInBounds = newMarkerBounds.some(bounds => bounds.leftMin <= currentLeft && currentLeft <= bounds.leftMax);
    setNewMarkerState({ left: currentLeft, isInBounds });
  };

  const updateStates = useCallback(() => {
    const bounds = timelineRef.current.getBoundingClientRect();
    const msToPxRatio = timelineRef.current.clientWidth / length;
    const minSegmentLength = MIN_PART_DURATION_IN_MS * msToPxRatio;
    const markers = parts.slice(1).map(part => ({ key: part.key, left: part.startTimecode * msToPxRatio }));

    const segments = parts.map((part, index) => {
      const segment = { key: part.key, title: part.title };

      if (parts.length === 1) {
        segment.width = bounds.width;
        return segment;
      }
      if (index === 0) {
        segment.width = markers[index].left;
        return segment;
      }
      if (index === parts.length - 1) {
        segment.width = bounds.width - markers[index - 1].left;
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
    setTimelineState({ markers, segments, msToPxRatio, bounds, minSegmentLength });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dragState || isTouchDevice()) {
      return () => { };
    }
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [dragState, handleWindowMouseMove, handleWindowMouseUp]);

  const renderMarker = (marker, index) => {
    const classes = classNames('Timeline-marker', { 'is-displayed': isTouchDevice() });
    return (
      <div key={marker.key} className={classes} style={{ left: `${marker.left}px` }}>
        <FlagOutlined onMouseDown={handleMarkerMouseDown(marker, index)} />
      </div>
    );
  };

  const renderSegment = segment => (
    <div key={segment.key} className="Timeline-segment" style={{ width: `${segment.width}px` }}>{segment.title}</div>
  );

  const renderButton = segment => {
    return segment.width >= MIN_PART_WIDTH_IN_PX && (
      <Button
        className="Timeline-deleteButton"
        type="link"
        icon={<DeleteIcon />}
        onClick={handleSegmentDelete(segment.key)}
        disabled={timelineState.segments.length === 1}
        />
    );
  };

  const renderDeleteSegment = segment => {
    const classes = classNames('Timeline-deleteSegment', { 'is-displayed': isTouchDevice() });

    return (
      <div key={segment.key} className={classes} style={{ width: `${segment.width}px` }}>
        {renderButton(segment)}
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })} ref={timelineRef}>
      <div className="Timeline-markersBar">
        {timelineState.markers.map(renderMarker)}
      </div>
      <div
        className="Timeline-segmentsBar"
        onClick={handleSegmentsBarClick}
        onMouseMove={handleSegmentsBarMouseMove}
        onMouseLeave={handleSegmentsBarMouseLeave}
        >
        {!!newMarkerState && (
          <Fragment>
            <div className="Timeline-newMarker" style={{ left: `${newMarkerState.left}px` }}>
              {newMarkerState.isInBounds && <FlagOutlined />}
              {!newMarkerState.isInBounds && <div className="Timeline-newMarkerCloseIcon"><CloseIcon /></div>}
            </div>
            <div className="Timeline-newSegmentStart" style={{ left: `${newMarkerState.left}px` }} />
          </Fragment>
        )}
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
  })).isRequired
};

Timeline.defaultProps = {
  onPartAdd: () => { },
  onPartDelete: () => { },
  onStartTimecodeChange: () => { }
};

export default Timeline;

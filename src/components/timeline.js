import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FlagOutlined } from '@ant-design/icons';
import CloseIcon from './icons/general/close-icon.js';
import DeleteIcon from './icons/general/delete-icon.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_DURATION_IN_MS = 1000;

function Timeline({ length, parts, onPartAdd, onPartDelete, onStartTimecodeChange }) {
  const timelineRef = useRef(null);

  const [timelineState, setTimelineState] = useState({
    markers: [],
    segments: [],
    msToPxRatio: 0,
    bounds: { left: 0, width: 0 }
  });
  const [newMarkerState, setNewMarkerState] = useState({
    left: 0,
    bounds: [],
    isInBounds: false,
    isVisible: false
  });
  const [dragState, setDragState] = useState(null);

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

    const newStartTimecode = dragState.marker.left / timelineState.msToPxRatio;
    onStartTimecodeChange(dragState.marker.key, newStartTimecode);
  }, [dragState, timelineState, onStartTimecodeChange]);

  const handleSegmentsBarClick = () => {
    if (newMarkerState.isVisible && newMarkerState.isInBounds) {
      const startTimecode = newMarkerState.left / timelineState.msToPxRatio;
      onPartAdd(startTimecode);
    }
  };

  const handleSegmentsBarMouseLeave = () => {
    setNewMarkerState(prevState => ({ ...prevState, isVisible: false }));
  };

  const handleSegmentsBarMouseMove = event => {
    if (dragState) {
      return;
    }

    const timelineBarHeight = timelineState.bounds.height / 3;
    const segmentsBarMinTop = timelineState.bounds.top + timelineBarHeight;
    const segmentsBarMaxTop = timelineState.bounds.top + (timelineBarHeight * 2);

    if (event.clientY > segmentsBarMaxTop || event.clientY < segmentsBarMinTop) {
      handleSegmentsBarMouseLeave();
      return;
    }

    const currentLeft = event.clientX - timelineState.bounds.left;
    const isInBounds = newMarkerState.bounds.some(bounds => bounds.leftMin <= currentLeft && currentLeft <= bounds.leftMax);
    setNewMarkerState(prevState => ({ ...prevState, left: currentLeft, isInBounds, isVisible: true }));
  };

  useEffect(() => {
    if (!dragState) {
      return () => { };
    }
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [dragState, handleWindowMouseMove, handleWindowMouseUp]);

  useEffect(() => {
    if (!timelineRef.current) {
      return;
    }

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

    const currentNewMarkerBounds = parts.map((part, index) => {
      const nextPartStartTimecode = parts[index + 1]?.startTimecode || length;
      const currentPartDuration = nextPartStartTimecode - part.startTimecode;
      if (currentPartDuration <= MIN_PART_DURATION_IN_MS) {
        return null;
      }
      return {
        leftMin: (part.startTimecode * msToPxRatio) + minSegmentLength,
        leftMax: (nextPartStartTimecode * msToPxRatio) - minSegmentLength
      };
    }).filter(bound => bound);

    setTimelineState({ markers, segments, msToPxRatio, bounds, minSegmentLength });
    setNewMarkerState(prevState => ({ ...prevState, bounds: currentNewMarkerBounds }));
  }, [timelineRef, parts, length]);

  const renderMarker = (marker, index) => {
    return (
      <div key={marker.key} id={marker.key} className="Timeline-marker" style={{ left: `${marker.left}px` }}>
        <div className="Timeline-partFlagsBar" onMouseDown={handleMarkerMouseDown(marker, index)}>
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
          onClick={handleSegmentDelete(segment.key)}
          disabled={timelineState.segments.length === 1}
          />
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
        {newMarkerState.isVisible && (
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

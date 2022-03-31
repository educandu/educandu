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
  const [markers, setMarkers] = useState([]);
  const [segments, setSegments] = useState([]);
  const [dragState, setDragState] = useState(null);
  const [msToPxRatio, setMsToPxRatio] = useState(0);
  const [timelineBounds, setTimelineBounds] = useState({ left: 0, width: 0 });
  const [newMarker, setNewMarker] = useState({ left: 0, bounds: [], isInBounds: false, isVisible: false });

  const handleSegmentDelete = key => () => onPartDelete(key);

  const handleMarkerMouseDown = (marker, index) => () => {
    const prevMarker = markers[index - 1];
    const nextMarker = markers[index + 1];

    const minSegmentLength = MIN_PART_DURATION_IN_MS * msToPxRatio;
    const bounds = {
      left: (prevMarker?.left || 0) + minSegmentLength,
      right: (nextMarker?.left || timelineBounds.width) - minSegmentLength
    };

    setDragState({ marker, bounds });
  };

  const handleWindowMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleWindowMouseMove = useCallback(event => {
    // Disable selection of DOM elements (e.g. text, image)
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

  const handleSegmentsBarMouseMove = event => {
    if (dragState) {
      return;
    }

    const currentLeft = event.clientX - timelineBounds.left;
    const isInBounds = newMarker.bounds.some(bounds => bounds.leftMin <= currentLeft && currentLeft <= bounds.leftMax);

    setNewMarker(prevState => ({ ...prevState, left: currentLeft, isInBounds, isVisible: true }));
  };

  const handleSegmentsBarMouseLeave = () => {
    setNewMarker(prevState => ({ ...prevState, isVisible: false }));
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

    const currentRatio = timelineRef.current.clientWidth / length;
    const currentTimelineBounds = timelineRef.current.getBoundingClientRect();
    const currentMarkers = parts.slice(1).map(part => ({ key: part.key, left: part.startTimecode * currentRatio }));

    const currentSegments = parts.map((part, index) => {
      const segment = { key: part.key, title: part.title };

      if (parts.length === 1) {
        segment.width = currentTimelineBounds.width;
        return segment;
      }
      if (index === 0) {
        segment.width = currentMarkers[index].left;
        return segment;
      }
      if (index === parts.length - 1) {
        segment.width = currentTimelineBounds.width - currentMarkers[index - 1].left;
        return segment;
      }
      segment.width = currentMarkers[index].left - currentMarkers[index - 1].left;
      return segment;
    });

    const minSegmentLength = MIN_PART_DURATION_IN_MS * currentRatio;

    const currentNewMarkerBounds = parts.map((part, index) => {
      const nextPartStartTimecode = parts[index + 1]?.startTimecode || length;
      const currentPartDuration = nextPartStartTimecode - part.startTimecode;
      if (currentPartDuration <= MIN_PART_DURATION_IN_MS) {
        return null;
      }
      return {
        leftMin: (part.startTimecode * currentRatio) + minSegmentLength,
        leftMax: (nextPartStartTimecode * currentRatio) - minSegmentLength
      };
    }).filter(bound => bound);

    setMarkers(currentMarkers);
    setSegments(currentSegments);
    setMsToPxRatio(currentRatio);
    setTimelineBounds(currentTimelineBounds);
    setNewMarker(prevState => ({ ...prevState, bounds: currentNewMarkerBounds }));
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
          disabled={segments.length === 1}
          />
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })} ref={timelineRef}>
      <div className="Timeline-markersBar">
        {markers.map(renderMarker)}
      </div>
      <div className="Timeline-segmentsBar" onMouseMove={handleSegmentsBarMouseMove} onMouseLeave={handleSegmentsBarMouseLeave}>
        { newMarker.isVisible && (
          <Fragment>
            <div className="Timeline-newMarker" style={{ left: `${newMarker.left}px` }}>
              {newMarker.isInBounds && <FlagOutlined />}
              {!newMarker.isInBounds && <div className="Timeline-newMarkerCloseIcon"><CloseIcon /></div>}
            </div>
            <div className="Timeline-newSegmentStart" style={{ left: `${newMarker.left}px` }} />
          </Fragment>
        )}
        {segments.map(renderSegment)}
      </div>
      <div className="Timeline-deletionBar">
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

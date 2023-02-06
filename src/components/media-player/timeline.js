import PropTypes from 'prop-types';
import classNames from 'classnames';
import DeleteButton from '../delete-button.js';
import { useTranslation } from 'react-i18next';
import PinIcon from '../icons/general/pin-icon.js';
import CloseIcon from '../icons/general/close-icon.js';
import { isTouchDevice } from '../../ui/browser-helper.js';
import { confirmDelete } from '../confirmation-dialogs.js';
import { usePercentageFormat } from '../locale-context.js';
import { getContrastColor } from '../../ui/color-helper.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ensureValidMediaPosition, formatMediaPosition } from '../../utils/media-utils.js';

const MARKER_WIDTH_IN_PX = 14;
const MIN_PART_WIDTH_IN_PX = 35;
const MIN_PART_FRACTION_IN_PERCENTAGE = 0.005;

function Timeline({ durationInMilliseconds, parts, selectedPartIndex, onPartAdd, onPartDelete, onStartPositionChange, onPartClick }) {
  const timelineRef = useRef(null);
  const { t } = useTranslation('timeline');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const [dragState, setDragState] = useState(null);
  const [newMarkerState, setNewMarkerState] = useState(null);
  const [newMarkerBounds, setNewMarkerBounds] = useState([]);
  const [timelineState, setTimelineState] = useState({ markers: [], segments: [], currentTimelineWidth: 0 });

  const handleSegmentDelete = segment => {
    confirmDelete(t, segment.title, () => {
      onPartDelete(segment.key);
    });
  };

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

  const handleMarkersBarClick = () => {
    if (!timelineState.currentTimelineWidth || isTouchDevice()) {
      return;
    }

    if (newMarkerState?.isInBounds) {
      const startPosition = ensureValidMediaPosition(newMarkerState.left / timelineState.currentTimelineWidth);
      setNewMarkerState(null);
      onPartAdd(startPosition);
    }
  };

  const handleMarkersBarMouseLeave = () => {
    setNewMarkerState(null);
  };

  const handleMarkersBarMouseMove = event => {
    if (dragState || isTouchDevice()) {
      return;
    }
    const timelineBounds = timelineRef.current.getBoundingClientRect();

    const timelineBarHeight = timelineBounds.height / 3;
    const segmentsBarMinTop = timelineBounds.top;
    const segmentsBarMaxTop = timelineBounds.top + timelineBarHeight;

    const isExceedingVerticalBounds = event.clientY > segmentsBarMaxTop || event.clientY < segmentsBarMinTop;
    const isExceedingHorizontalBounds = event.clientX < timelineBounds.x || event.clientX > timelineBounds.x + timelineBounds.width;
    if (isExceedingVerticalBounds || isExceedingHorizontalBounds) {
      handleMarkersBarMouseLeave();
      return;
    }

    const currentLeft = event.clientX - timelineBounds.left;

    const isOverlappingPin = timelineState.markers
      .some(marker => currentLeft >= marker.left - (MARKER_WIDTH_IN_PX / 2) && currentLeft <= marker.left + (MARKER_WIDTH_IN_PX / 2));

    if (isOverlappingPin) {
      handleMarkersBarMouseLeave();
      return;
    }

    const isInBounds = newMarkerBounds.some(bounds => bounds.leftMin <= currentLeft && currentLeft <= bounds.leftMax);
    setNewMarkerState({ left: currentLeft, isInBounds });
  };

  const handleSegmentClick = (event, segment) => {
    onPartClick(segment.key);
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
      <div
        key={marker.key}
        style={{ left: `${marker.left - (MARKER_WIDTH_IN_PX / 2)}px` }}
        className="Timeline-marker Timeline-marker--draggable"
        >
        {!!dragState && (
          <div className="Timeline-markerTimecode">{markerText}</div>
        )}
        <div onMouseDown={handleMarkerMouseDown(marker, index)}>
          <PinIcon />
        </div>
      </div>
    );
  };

  const renderNewMarker = () => {
    if (!timelineState.currentTimelineWidth) {
      return null;
    }

    const percentage = newMarkerState.left / timelineState.currentTimelineWidth;
    const markerText = formatMediaPosition({ position: percentage, duration: durationInMilliseconds, formatPercentage });

    return (
      <div
        key="new-marker"
        className="Timeline-marker Timeline-marker--new"
        style={{ left: `${newMarkerState.left - (MARKER_WIDTH_IN_PX / 2)}px` }}
        >
        <div
          className={classNames(
            'Timeline-markerTimecode',
            { 'Timeline-markerTimecode--valid': newMarkerState.isInBounds },
            { 'Timeline-markerTimecode--invalid': !newMarkerState.isInBounds }
          )}
          >
          {markerText}
        </div>
        {!!newMarkerState.isInBounds && <PinIcon />}
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
      <div
        key={segment.key}
        style={style}
        className={classes}
        onClick={event => handleSegmentClick(event, segment)}
        >
        {segment.title}
      </div>
    );
  };

  const renderNewSegmentStart = () => {
    return (
      <div className="Timeline-newSegmentStart" style={{ left: `${newMarkerState.left}px` }} />
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
          <DeleteButton
            onClick={() => handleSegmentDelete(segment)}
            disabled={timelineState.segments.length === 1}
            />
        )}
      </div>
    );
  };

  return (
    <div className={classNames('Timeline', { 'is-dragging': !!dragState })} ref={timelineRef}>
      <div
        className="Timeline-markersBar"
        onClick={handleMarkersBarClick}
        onMouseMove={handleMarkersBarMouseMove}
        onMouseLeave={handleMarkersBarMouseLeave}
        >
        {parts.length <= 1 && (
          <div className="Timeline-markersBarPlaceholder">{t('markersBarPlaceholder')}</div>
        )}
        {timelineState.markers.map(renderExistingMarker)}
        {!!newMarkerState && renderNewMarker()}
      </div>
      <div className="Timeline-segmentsBarWrapper">
        {!!newMarkerState && renderNewSegmentStart()}
        <div className="Timeline-segmentsBar">
          {timelineState.segments.map(renderSegment)}
        </div>
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
  onPartClick: PropTypes.func,
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
  onPartClick: () => { },
  onPartDelete: () => { },
  onStartPositionChange: () => { },
  selectedPartIndex: -1
};

export default Timeline;

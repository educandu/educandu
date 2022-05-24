import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isTouchDevice } from '../ui/browser-helper.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const TOOLTIP_WIDTH_IN_PX = 60;
const MARK_TIMECODE_WIDTH_IN_PX = 40;

function MediaPlayerProgressBar({ durationInMilliseconds, playedMilliseconds, marks, onSeek }) {
  const progressBarRef = useRef(null);
  const isMediaLoaded = !!durationInMilliseconds;

  const [msToPxRatio, setMsToPxRatio] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipTitle, setTooltipTitle] = useState(null);

  const stopDragging = () => {
    setTooltipTitle(null);
    setIsDragging(false);
  };

  const updateMsToPxRatio = useCallback(() => {
    setMsToPxRatio(progressBarRef.current && durationInMilliseconds
      ? progressBarRef.current.clientWidth / durationInMilliseconds
      : 0);
  }, [progressBarRef, durationInMilliseconds]);

  const seekToClientX = useCallback(clientX => {
    const barLeft = progressBarRef.current.getBoundingClientRect().left;
    const currentLeft = Math.max(clientX - barLeft, 0);

    let seekTimecode = Math.trunc(currentLeft ? currentLeft / msToPxRatio : 0);

    if (seekTimecode > durationInMilliseconds) {
      seekTimecode = durationInMilliseconds;
    }

    setTooltipTitle(formatMillisecondsAsDuration(seekTimecode));

    onSeek(seekTimecode);
  }, [onSeek, durationInMilliseconds, msToPxRatio]);

  const handleBarMouseDown = event => {
    if (!isMediaLoaded || isTouchDevice()) {
      return;
    }
    setIsDragging(true);
    seekToClientX(event.clientX);
  };

  const handleBarTouchStart = event => {
    if (!isMediaLoaded) {
      return;
    }
    setIsDragging(true);
    seekToClientX(event.touches[0].clientX);
  };

  const handleWindowMouseMove = useCallback(event => {
    // Disable selection of DOM elements (e.g. text, image)
    event.preventDefault();
    seekToClientX(event.clientX);
  }, [seekToClientX]);

  const handleWindowTouchMove = useCallback(event => {
    seekToClientX(event.touches[0].clientX);
  }, [seekToClientX]);

  const handleWindowTouchEnd = stopDragging;
  const handleWindowMouseUp = stopDragging;

  useEffect(() => {
    updateMsToPxRatio();
    window.addEventListener('resize', updateMsToPxRatio);

    return () => {
      window.removeEventListener('resize', updateMsToPxRatio);
    };
  }, [updateMsToPxRatio]);

  useEffect(() => {
    if (!isDragging) {
      return () => { };
    }

    if (isTouchDevice()) {
      window.addEventListener('touchmove', handleWindowTouchMove);
      window.addEventListener('touchend', handleWindowTouchEnd);
    } else {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }

    return () => {
      if (isTouchDevice()) {
        window.removeEventListener('touchmove', handleWindowTouchMove);
        window.removeEventListener('touchend', handleWindowTouchEnd);
      } else {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      }
    };
  }, [isDragging, handleWindowMouseMove, handleWindowMouseUp, handleWindowTouchMove, handleWindowTouchEnd]);

  const renderMark = mark => {
    const leftPx = msToPxRatio * mark.timecode;

    return (
      <Fragment key={mark.key}>
        <div className="MediaPlayerProgressBar-mark" style={{ left: `${leftPx}px` }} />
        <div
          className="MediaPlayerProgressBar-markTimecode"
          style={{ width: `${MARK_TIMECODE_WIDTH_IN_PX}px`, left: `${leftPx - (MARK_TIMECODE_WIDTH_IN_PX / 2)}px` }}
          >
          {formatMillisecondsAsDuration(mark.timecode)}
        </div>
      </Fragment>
    );
  };

  const classes = classNames('MediaPlayerProgressBar', { 'is-enabled': isMediaLoaded });
  const currentProgressInPx = playedMilliseconds * msToPxRatio;

  return (
    <div className={classes} ref={progressBarRef}>
      <div className="MediaPlayerProgressBar-baseBar" />
      {tooltipTitle && (
        <div
          className="MediaPlayerProgressBar-progressTooltip"
          style={{ width: `${TOOLTIP_WIDTH_IN_PX}px`, left: `${currentProgressInPx - (TOOLTIP_WIDTH_IN_PX / 2)}px` }}
          >
          <div className="MediaPlayerProgressBar-progressTooltipText">{tooltipTitle}</div>
          <div className="MediaPlayerProgressBar-progressTooltipArrow" />
        </div>
      )}
      <div className="MediaPlayerProgressBar-progress" style={{ width: `${currentProgressInPx}px` }} />
      {isMediaLoaded && marks.map(renderMark)}
      <div
        className="MediaPlayerProgressBar-interractionOverlay"
        onMouseDown={handleBarMouseDown}
        onTouchStart={handleBarTouchStart}
        />
    </div>
  );
}

MediaPlayerProgressBar.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  marks: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    timecode: PropTypes.number.isRequired,
    text: PropTypes.string
  })),
  onSeek: PropTypes.func.isRequired,
  playedMilliseconds: PropTypes.number.isRequired
};

MediaPlayerProgressBar.defaultProps = {
  marks: []
};

export default MediaPlayerProgressBar;

import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isTouchDevice } from '../ui/browser-helper.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const TOOLTIP_WIDTH_IN_PX = 60;
const MARK_TIMECODE_WIDTH_IN_PX = 40;

function MediaPlayerProgressBar({
  durationInMilliseconds,
  playedMilliseconds,
  marks,
  onSeek,
  onSeekStart,
  onSeekEnd
}) {
  const progressBarRef = useRef(null);
  const isMediaLoaded = !!durationInMilliseconds;

  const [msToPxRatio, setMsToPxRatio] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipState, setTooltipState] = useState(null);

  const stopDragging = () => {
    setTooltipState(null);
    setIsDragging(false);
    onSeekEnd();
  };

  const updateMsToPxRatio = useCallback(() => {
    setMsToPxRatio(progressBarRef.current && durationInMilliseconds
      ? progressBarRef.current.clientWidth / durationInMilliseconds
      : 0);
  }, [progressBarRef, durationInMilliseconds]);

  const convertClientXToTimecode = useCallback(clientX => {
    const barLeft = progressBarRef.current.getBoundingClientRect().left;
    const currentLeft = Math.max(clientX - barLeft, 0);
    const timecode = Math.trunc(currentLeft ? currentLeft / msToPxRatio : 0);

    return timecode > durationInMilliseconds ? durationInMilliseconds : timecode;
  }, [durationInMilliseconds, msToPxRatio]);

  const seekToClientX = useCallback(clientX => {
    const seekToTimecode = convertClientXToTimecode(clientX);

    setTooltipState({
      title: formatMillisecondsAsDuration(seekToTimecode),
      left: (seekToTimecode * msToPxRatio) - (TOOLTIP_WIDTH_IN_PX / 2)
    });

    onSeek(seekToTimecode);
  }, [onSeek, msToPxRatio, convertClientXToTimecode]);

  const handleBarMouseHover = event => {
    if (!isMediaLoaded || isDragging || isTouchDevice()) {
      return;
    }

    const mouseOverTimecode = convertClientXToTimecode(event.clientX);

    setTooltipState({
      title: formatMillisecondsAsDuration(mouseOverTimecode),
      left: (mouseOverTimecode * msToPxRatio) - (TOOLTIP_WIDTH_IN_PX / 2)
    });
  };

  const handleBarMouseLeave = () => {
    if (isDragging) {
      return;
    }
    setTooltipState(null);
  };

  const handleBarMouseDown = event => {
    if (!isMediaLoaded || isTouchDevice()) {
      return;
    }
    onSeekStart();
    setIsDragging(true);
    seekToClientX(event.clientX);
  };

  const handleBarTouchStart = event => {
    if (!isMediaLoaded) {
      return;
    }
    onSeekStart();
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
      {tooltipState && (
        <div
          className="MediaPlayerProgressBar-progressTooltip"
          style={{ width: `${TOOLTIP_WIDTH_IN_PX}px`, left: `${tooltipState.left}px` }}
          >
          <div className="MediaPlayerProgressBar-progressTooltipText">{tooltipState.title}</div>
          <div className="MediaPlayerProgressBar-progressTooltipArrow" />
        </div>
      )}
      <div className="MediaPlayerProgressBar-progress" style={{ width: `${currentProgressInPx}px` }} />
      {isMediaLoaded && marks.map(renderMark)}
      <div
        className="MediaPlayerProgressBar-interractionOverlay"
        onMouseDown={handleBarMouseDown}
        onTouchStart={handleBarTouchStart}
        onMouseOver={handleBarMouseHover}
        onMouseMove={handleBarMouseHover}
        onMouseLeave={handleBarMouseLeave}
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
  onSeekEnd: PropTypes.func,
  onSeekStart: PropTypes.func,
  playedMilliseconds: PropTypes.number.isRequired
};

MediaPlayerProgressBar.defaultProps = {
  marks: [],
  onSeekEnd: () => {},
  onSeekStart: () => {}
};

export default MediaPlayerProgressBar;

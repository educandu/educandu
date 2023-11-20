import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isTouchDevice } from '../../ui/browser-helper.js';
import { usePercentageFormat } from '../locale-context.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ensureValidMediaPosition, formatMediaPosition } from '../../utils/media-utils.js';

const TOOLTIP_WIDTH_IN_PX = 60;
const MARK_TIMECODE_WIDTH_IN_PX = 40;

function MediaPlayerProgressBar({
  allowPartClick,
  disabled,
  durationInMilliseconds,
  millisecondsLength,
  playedMilliseconds,
  parts,
  onSeek,
  onSeekStart,
  onSeekEnd
}) {
  const progressBarRef = useRef(null);
  const isMediaLoaded = !!durationInMilliseconds;

  const [isDragging, setIsDragging] = useState(false);
  const [tooltipState, setTooltipState] = useState(null);
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });
  const [progressBarWidthInPx, setProgressBarWidthInPx] = useState(0);

  const stopDragging = () => {
    setTooltipState(null);
    setIsDragging(false);
    onSeekEnd();
  };

  const captureProgressBarWidth = useCallback(() => {
    setProgressBarWidthInPx(progressBarRef.current?.clientWidth || 0);
  }, [progressBarRef]);

  const convertClientXToPosition = useCallback(clientX => {
    const barLeft = progressBarRef.current.getBoundingClientRect().left;
    const currentLeft = Math.max(clientX - barLeft, 0);
    const position = progressBarWidthInPx ? currentLeft / progressBarWidthInPx : 0;
    return ensureValidMediaPosition(position);
  }, [progressBarWidthInPx]);

  const seekToClientX = useCallback(clientX => {
    const position = convertClientXToPosition(clientX);

    setTooltipState({
      title: formatMediaPosition({ formatPercentage, position, duration: durationInMilliseconds, millisecondsLength }),
      left: (position * progressBarWidthInPx) - (TOOLTIP_WIDTH_IN_PX / 2)
    });

    onSeek(position * durationInMilliseconds);
  }, [convertClientXToPosition, formatPercentage, durationInMilliseconds, progressBarWidthInPx, millisecondsLength, onSeek]);

  const handleBarMouseHover = event => {
    if (!isMediaLoaded || isDragging || isTouchDevice()) {
      return;
    }

    const position = convertClientXToPosition(event.clientX);

    setTooltipState({
      title: formatMediaPosition({ formatPercentage, position, duration: durationInMilliseconds, millisecondsLength }),
      left: (position * progressBarWidthInPx) - (TOOLTIP_WIDTH_IN_PX / 2)
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

  const handlePartClick = part => {
    if (allowPartClick) {
      onSeek(part.startPosition * durationInMilliseconds);
    }
  };

  useEffect(() => {
    captureProgressBarWidth();
    window.addEventListener('resize', captureProgressBarWidth);

    return () => {
      window.removeEventListener('resize', captureProgressBarWidth);
    };
  }, [captureProgressBarWidth]);

  useEffect(() => {
    if (!isDragging) {
      return () => {};
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

  const renderPartStart = part => {
    if (part.startPosition === 0) {
      return <Fragment key={part.startPosition} />;
    }

    const leftPx = progressBarWidthInPx * part.startPosition;
    const markTextClasses = classNames(
      'MediaPlayerProgressBar-markText',
      { 'MediaPlayerProgressBar-markText--clickable': !disabled && allowPartClick }
    );

    return (
      <Fragment key={part.startPosition}>
        <div className="MediaPlayerProgressBar-mark" style={{ left: `${leftPx}px` }} />
        <div
          className={markTextClasses}
          style={{ width: `${MARK_TIMECODE_WIDTH_IN_PX}px`, left: `${leftPx - (MARK_TIMECODE_WIDTH_IN_PX / 2)}px` }}
          onClick={disabled ? null : () => handlePartClick(part)}
          >
          {part.text || formatMediaPosition({
            position: part.startPosition,
            duration: durationInMilliseconds,
            millisecondsLength,
            formatPercentage
          })}
        </div>
      </Fragment>
    );
  };

  const rootClasses = classNames('MediaPlayerProgressBar', { 'is-enabled': !disabled && isMediaLoaded });
  const interractionOverlayClasses = classNames('MediaPlayerProgressBar-interractionOverlay', { 'is-disabled': disabled });

  const currentProgressInPx = !disabled && isMediaLoaded
    ? (playedMilliseconds / durationInMilliseconds) * progressBarWidthInPx
    : 0;

  return (
    <div className={rootClasses} ref={progressBarRef}>
      <div className="MediaPlayerProgressBar-baseBar" />
      {!disabled && !!tooltipState && (
        <div
          className="MediaPlayerProgressBar-progressTooltip"
          style={{ width: `${TOOLTIP_WIDTH_IN_PX}px`, left: `${tooltipState.left}px` }}
          >
          <div className="MediaPlayerProgressBar-progressTooltipText">{tooltipState.title}</div>
          <div className="MediaPlayerProgressBar-progressTooltipArrow" />
        </div>
      )}
      <div className="MediaPlayerProgressBar-progress" style={{ width: `${currentProgressInPx}px` }} />
      {!!isMediaLoaded && parts.map(renderPartStart)}
      <div
        className={interractionOverlayClasses}
        onMouseDown={disabled ? null : handleBarMouseDown}
        onTouchStart={disabled ? null : handleBarTouchStart}
        onMouseOver={disabled ? null : handleBarMouseHover}
        onMouseMove={disabled ? null : handleBarMouseHover}
        onMouseLeave={disabled ? null : handleBarMouseLeave}
        />
    </div>
  );
}

MediaPlayerProgressBar.propTypes = {
  allowPartClick: PropTypes.bool,
  disabled: PropTypes.bool,
  durationInMilliseconds: PropTypes.number,
  millisecondsLength: PropTypes.number,
  onSeek: PropTypes.func,
  onSeekEnd: PropTypes.func,
  onSeekStart: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired,
    text: PropTypes.string
  })),
  playedMilliseconds: PropTypes.number
};

MediaPlayerProgressBar.defaultProps = {
  allowPartClick: false,
  disabled: false,
  durationInMilliseconds: 0,
  millisecondsLength: 0,
  onSeek: () => {},
  onSeekEnd: () => {},
  onSeekStart: () => {},
  parts: [{ startPosition: 0 }],
  playedMilliseconds: 0
};

export default MediaPlayerProgressBar;

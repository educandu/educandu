import PropTypes from 'prop-types';
import classNames from 'classnames';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const TOOLTIP_WIDTH_IN_PX = 60;
const MARK_TIMECODE_WIDTH_IN_PX = 40;

function MediaPlayerProgressBar({ durationInMilliseconds, playedMilliseconds, marks, onSeek }) {
  const progressBarRef = useRef(null);
  const isMediaLoaded = !!durationInMilliseconds;
  const [msToPxRatio, setMsToPxRatio] = useState(0);
  const [tooltipTitle, setTooltipTitle] = useState(null);

  const renderMark = mark => {
    const leftPx = msToPxRatio * mark.timecode;

    return (
      <Fragment>
        <div key={mark.key} className="MediaPlayerProgressBar-mark" style={{ left: `${leftPx}px` }} />
        <div
          className="MediaPlayerProgressBar-markTimecode"
          style={{ width: `${MARK_TIMECODE_WIDTH_IN_PX}px`, left: `${leftPx - (MARK_TIMECODE_WIDTH_IN_PX / 2)}px` }}
          >
          {formatMillisecondsAsDuration(mark.timecode)}
        </div>
      </Fragment>
    );
  };

  const updateStates = useCallback(() => {
    const newMsToPxRatio = progressBarRef.current.clientWidth / durationInMilliseconds;
    setMsToPxRatio(newMsToPxRatio);
  }, [durationInMilliseconds]);

  useEffect(() => {
    if (progressBarRef.current) {
      updateStates();
    }
  }, [progressBarRef, updateStates]);

  useEffect(() => {
    window.addEventListener('resize', updateStates);
    return () => {
      window.removeEventListener('resize', updateStates);
    };
  }, [updateStates]);

  const handleBarClick = event => {
    if (!isMediaLoaded) {
      return;
    }

    event.stopPropagation();

    const barOffset = progressBarRef.current.getBoundingClientRect().left;
    const barClickPosition = Math.max(event.clientX - barOffset, 0);
    const seekTimecode = Math.trunc(barClickPosition ? barClickPosition / msToPxRatio : 0);

    setTooltipTitle(formatMillisecondsAsDuration(seekTimecode));
    setTimeout(() => setTooltipTitle(null), 250);

    onSeek(seekTimecode);
  };

  const classes = classNames('MediaPlayerProgressBar', { 'is-enabled': isMediaLoaded });
  const currentProgressInPx = playedMilliseconds * msToPxRatio;

  return (
    <div className={classes} ref={progressBarRef}>
      <div className="MediaPlayerProgressBar-baseBar" onClick={handleBarClick} />
      {tooltipTitle && (
        <div
          className="MediaPlayerProgressBar-progressTooltip"
          style={{
            width: `${TOOLTIP_WIDTH_IN_PX}px`,
            left: `${currentProgressInPx - (TOOLTIP_WIDTH_IN_PX / 2)}px`
          }}
          >
          <div className="MediaPlayerProgressBar-progressTooltipText">{tooltipTitle}</div>
          <div className="MediaPlayerProgressBar-progressTooltipArrow" />
        </div>
      )}
      <div className="MediaPlayerProgressBar-progress" style={{ width: `${currentProgressInPx}px` }} onClick={handleBarClick} />
      {isMediaLoaded && marks.map(renderMark)}
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

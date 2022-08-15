import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import VolumeSlider from './volume-slider.js';
import { useTranslation } from 'react-i18next';
import ForwardIcon from './icons/media-player/forward-icon.js';
import BackwardIcon from './icons/media-player/backward-icon.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import FastForwardIcon from './icons/media-player/fast-forward-icon.js';
import FastBackwardIcon from './icons/media-player/fast-backward-icon.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 10;
const OFFSET_DIRECTION = {
  left: -1,
  right: 1
};

function TrackMixer({
  mainTrack,
  secondaryTracks,
  mainTrackDurationInMs,
  secondaryTracksDurationsInMs,
  onMainTrackChange,
  onSecondaryTrackChange
}) {
  const mainTrackBarRef = useRef(null);
  const { t } = useTranslation('trackMixer');

  const [secondaryTracksState, setSecondaryTracksState] = useState(secondaryTracks.map(() => ({
    barWidthInPx: 0,
    marginLeftInPx: 0,
    canBeNegativelyOffset: false,
    canBePositivelyOffset: false
  })));

  const updateStates = useCallback(() => {
    const mainTrackBarWidth = mainTrackBarRef.current?.clientWidth;
    const maxSecondaryTrackBarWidth = mainTrackBarWidth + (2 * ALLOWED_TRACK_BAR_OVERFLOW_IN_PX);

    if (!mainTrackBarWidth || !mainTrackDurationInMs) {
      return;
    }

    const maxPositiveOffset = mainTrackDurationInMs;
    const msToPxRatio = mainTrackBarWidth / mainTrackDurationInMs;

    setSecondaryTracksState(secondaryTracks.map((secondaryTrack, index) => {
      const maxNegativeOffset = -secondaryTracksDurationsInMs[index];
      const barWidthInPx = secondaryTracksDurationsInMs[index] * msToPxRatio;
      const marginLeftInPx = secondaryTrack.offsetTimecode * msToPxRatio;

      const isLeftBoundReached = marginLeftInPx <= -ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      const canBeNegativelyOffset = secondaryTrack.offsetTimecode >= 0 || secondaryTrack.offsetTimecode > maxNegativeOffset;

      const isRightBoundReached = (marginLeftInPx + barWidthInPx) >= mainTrackBarWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      const canBePositivelyOffset = secondaryTrack.offsetTimecode <= 0 || secondaryTrack.offsetTimecode < maxPositiveOffset;

      const newState = {
        barWidthInPx,
        marginLeftInPx,
        canBeNegativelyOffset,
        canBePositivelyOffset
      };

      if (isLeftBoundReached) {
        newState.marginLeftInPx = -ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
        newState.barWidthInPx = barWidthInPx + marginLeftInPx + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      }

      if (isRightBoundReached) {
        newState.barWidthInPx = mainTrackBarWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX - marginLeftInPx;
      }

      newState.barWidthInPx = Math.min(newState.barWidthInPx, maxSecondaryTrackBarWidth);
      return newState;
    }));
  }, [mainTrackBarRef, mainTrackDurationInMs, secondaryTracks, secondaryTracksDurationsInMs]);

  const handleMainTrackVolumeChange = volume => {
    onMainTrackChange({ ...mainTrack, volume });
  };

  const handleSecondaryTrackVolumeChange = (index, volume) => {
    onSecondaryTrackChange(index, { ...secondaryTracks[index], volume });
  };

  const handleTrackBarArrowClick = ({ index, stepInMs, direction }) => {
    let newOffsetTimecode = secondaryTracks[index].offsetTimecode + (stepInMs * direction);

    const maxNegativeOffset = -secondaryTracksDurationsInMs[index];
    const maxPositiveOffset = mainTrackDurationInMs;

    if (direction === OFFSET_DIRECTION.left && newOffsetTimecode <= maxNegativeOffset) {
      newOffsetTimecode = -secondaryTracksDurationsInMs[index];
    }
    if (direction === OFFSET_DIRECTION.right && newOffsetTimecode >= maxPositiveOffset) {
      newOffsetTimecode = mainTrackDurationInMs;
    }

    onSecondaryTrackChange(index, { ...secondaryTracks[index], offsetTimecode: newOffsetTimecode });
  };

  useEffect(() => {
    updateStates();
  }, [mainTrackBarRef, mainTrackDurationInMs, secondaryTracks, secondaryTracksDurationsInMs, updateStates]);

  useEffect(() => {
    window.addEventListener('resize', updateStates);
    return () => {
      window.removeEventListener('resize', updateStates);
    };
  }, [updateStates]);

  const renderSecondaryTrackNameRow = (secondaryTrack, index) => {
    return (
      <div className="TrackMixer-nameRow" key={index}>
        <div className="TrackMixer-name">{secondaryTrack.name}</div>
        <VolumeSlider value={secondaryTrack.volume} onChange={value => handleSecondaryTrackVolumeChange(index, value)} />
      </div>
    );
  };

  const renderSecondaryTrackBarRow = (secondaryTrack, index) => {
    const canShowBar = !!secondaryTracksState[index]?.barWidthInPx;
    const offsetTimecode = secondaryTrack.offsetTimecode;
    const offsetAsDuration = formatMillisecondsAsDuration(Math.abs(offsetTimecode), { millisecondsLength: 1 });
    const offsetText = offsetTimecode >= 0 ? `+ ${offsetAsDuration}` : `- ${offsetAsDuration}`;

    const barRowOffsetClasses = classNames(
      'TrackMixer-barRowOffset',
      { 'TrackMixer-barRowOffset--negative': offsetTimecode < 0 }
    );

    return (
      <div className="TrackMixer-barRow" key={index}>
        {canShowBar && (
          <div className={barRowOffsetClasses}>
            {offsetText}
          </div>
        )}
        <div
          className="TrackMixer-bar TrackMixer-bar--secondaryTrack"
          style={{ left: `${secondaryTracksState[index]?.marginLeftInPx}px`, width: `${secondaryTracksState[index]?.barWidthInPx}px` }}
          />
        {!canShowBar && <span className="TrackMixer-barPlaceholderText">{t('noTrack')}</span>}
        <div className="TrackMixer-barOverflow TrackMixer-barOverflow--left" />
        <div className="TrackMixer-barOverflow TrackMixer-barOverflow--right" />
        <div className="TrackMixer-barArrows TrackMixer-barArrows--left">
          <Button
            type="link"
            size="small"
            icon={<FastBackwardIcon />}
            onClick={() => handleTrackBarArrowClick({ index, stepInMs: 1000, direction: OFFSET_DIRECTION.left })}
            disabled={!canShowBar || !secondaryTracksState[index]?.canBeNegativelyOffset}
            />
          <Button
            type="link"
            size="small"
            icon={<BackwardIcon />}
            onClick={() => handleTrackBarArrowClick({ index, stepInMs: 100, direction: OFFSET_DIRECTION.left })}
            disabled={!canShowBar || !secondaryTracksState[index]?.canBeNegativelyOffset}
            />
        </div>
        <div className="TrackMixer-barArrows TrackMixer-barArrows--right">
          <Button
            type="link"
            size="small"
            icon={<ForwardIcon />}
            onClick={() => handleTrackBarArrowClick({ index, stepInMs: 100, direction: OFFSET_DIRECTION.right })}
            disabled={!canShowBar || !secondaryTracksState[index]?.canBePositivelyOffset}
            />
          <Button
            type="link"
            size="small"
            icon={<FastForwardIcon />}
            onClick={() => handleTrackBarArrowClick({ index, stepInMs: 1000, direction: OFFSET_DIRECTION.right })}
            disabled={!canShowBar || !secondaryTracksState[index]?.canBePositivelyOffset}
            />
        </div>
      </div>
    );
  };

  return (
    <div className="TrackMixer">
      <div className="TrackMixer-namesColumn">
        <div className="TrackMixer-nameRow">
          <div className="TrackMixer-name">{mainTrack.name}</div>
          <VolumeSlider value={mainTrack.volume} onChange={handleMainTrackVolumeChange} />
        </div>
        {secondaryTracks.map(renderSecondaryTrackNameRow)}
      </div>

      <div className="TrackMixer-barsColumn">
        <div className="TrackMixer-barRow">
          {!!mainTrackDurationInMs && (
            <Fragment>
              <div className="TrackMixer-barRowDuration">
                <span>{formatMillisecondsAsDuration(0, { millisecondsLength: 1 })}</span>
                <span>{formatMillisecondsAsDuration(mainTrackDurationInMs, { millisecondsLength: 1 })}</span>
              </div>
              <div className="TrackMixer-bar" ref={mainTrackBarRef} />
            </Fragment>
          )}
          {!mainTrackDurationInMs && <span className="TrackMixer-barPlaceholderText">{t('noTrack')}</span>}
        </div>
        {secondaryTracks.map(renderSecondaryTrackBarRow)}
      </div>
    </div>
  );
}

TrackMixer.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number.isRequired
  }).isRequired,
  mainTrackDurationInMs: PropTypes.number.isRequired,
  onMainTrackChange: PropTypes.func.isRequired,
  onSecondaryTrackChange: PropTypes.func.isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    offsetTimecode: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired
  })).isRequired,
  secondaryTracksDurationsInMs: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default TrackMixer;
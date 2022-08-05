import { Button } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import VolumeSlider from './volume-slider.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';

let trackBarInterval;

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 15;

function TrackMixer({
  mainTrack,
  secondaryTracks,
  mainTrackDurationInMs,
  secondaryTracksDurationsInMs,
  onMainTrackChange,
  onSecondaryTrackChange
}) {
  const mainTrackBarRef = useRef(null);
  const [secondaryTracksState, setSecondaryTracksState] = useState(secondaryTracks.map(() => ({
    barWidth: 0,
    marginLeft: 0,
    isLeftArrowDisabled: true,
    isRightArrowDisabled: true
  })));

  const updateStates = useCallback(() => {
    const maxTrackBarWidth = mainTrackBarRef.current?.clientWidth;

    if (!maxTrackBarWidth || !mainTrackDurationInMs) {
      return;
    }

    setSecondaryTracksState(secondaryTracks.map((secondaryTrack, index) => {
      const secondaryTrackDuration = secondaryTracksDurationsInMs[index];
      const msInPx = maxTrackBarWidth / mainTrackDurationInMs;
      const barWidth = secondaryTrackDuration * msInPx;
      const marginLeft = secondaryTrack.offsetTimecode * msInPx;

      const isLeftBoundReached = marginLeft <= -ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      const isLeftArrowDisabled = secondaryTrackDuration <= -secondaryTrack.offsetTimecode;

      const isRightBoundReached = (marginLeft + barWidth) >= maxTrackBarWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      const isRightArrowDisabled = mainTrackDurationInMs <= secondaryTrack.offsetTimecode;

      const newState = {
        barWidth,
        marginLeft,
        isLeftArrowDisabled,
        isRightArrowDisabled
      };

      if (isLeftArrowDisabled || isRightArrowDisabled) {
        clearInterval(trackBarInterval);
        trackBarInterval = null;
      }

      if (isLeftBoundReached) {
        newState.marginLeft = -ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
        newState.barWidth = barWidth + marginLeft + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      }

      if (isRightBoundReached) {
        newState.barWidth = maxTrackBarWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX - marginLeft;
      }

      // eslint-disable-next-line no-console
      console.log('maxTrackBarWidth', maxTrackBarWidth, 'barWidth', newState.barWidth, 'marginLeft', newState.marginLeft);

      return newState;
    }));
  }, [mainTrackBarRef, mainTrackDurationInMs, secondaryTracks, secondaryTracksDurationsInMs]);

  useEffect(() => {
    updateStates();
  }, [mainTrackBarRef, mainTrackDurationInMs, secondaryTracks, updateStates]);

  useEffect(() => {
    window.addEventListener('resize', updateStates);
    return () => {
      window.removeEventListener('resize', updateStates);
    };
  }, [updateStates]);

  const handleTrackBarArrowMouseDown = (index, directionUnit) => {
    if (trackBarInterval) {
      clearInterval(trackBarInterval);
      trackBarInterval = null;
    }

    let offsetTimecode = secondaryTracks[index].offsetTimecode;

    trackBarInterval = setInterval(() => {
      if (trackBarInterval) {
        offsetTimecode += 1000 * directionUnit;

        onSecondaryTrackChange(index, { ...secondaryTracks[index], offsetTimecode });
      }
    }, 100);
  };

  const handleTrackBarArrowMouseUp = () => {
    clearInterval(trackBarInterval);
    trackBarInterval = null;
  };

  const handleMainTrackVolumeChange = volume => {
    onMainTrackChange({ ...mainTrack, volume });
  };

  const handleSecondaryTrackVolumeChange = (index, volume) => {
    onSecondaryTrackChange(index, { ...secondaryTracks[index], volume });
  };

  const renderSecondaryTrackNameRow = (secondaryTrack, index) => {
    return (
      <div className="TrackMixer-nameRow" key={index}>
        <div className="TrackMixer-name">{secondaryTrack.name}</div>
        <VolumeSlider value={secondaryTrack.volume} onChange={value => handleSecondaryTrackVolumeChange(index, value)} />
      </div>
    );
  };

  const renderSecondaryTrackBarRow = (secondaryTrack, index) => {
    const offsetTimecode = secondaryTracks[index].offsetTimecode;
    const offsetAsDuration = formatMillisecondsAsDuration(Math.abs(offsetTimecode));
    const offsetText = offsetTimecode >= 0 ? `+ ${offsetAsDuration}` : `- ${offsetAsDuration}`;

    return (
      <div className="TrackMixer-barRow" key={index}>
        <div className={classNames('TrackMixer-barRowOffset', { 'TrackMixer-barRowOffset--negative': offsetTimecode < 0 })}>
          {offsetText}
        </div>
        <div
          className="TrackMixer-bar TrackMixer-bar--secondaryTrack"
          style={{ left: `${secondaryTracksState[index].marginLeft}px`, width: `${secondaryTracksState[index].barWidth}px` }}
          />
        <div className="TrackMixer-barOverflow TrackMixer-barOverflow--left" />
        <div className="TrackMixer-barOverflow TrackMixer-barOverflow--right" />
        <div className="TrackMixer-barArrow TrackMixer-barArrow--left">
          <Button
            type="link"
            size="small"
            icon={<CaretLeftOutlined />}
            onMouseDown={() => handleTrackBarArrowMouseDown(index, -1)}
            onMouseUp={() => handleTrackBarArrowMouseUp()}
            disabled={!secondaryTracksState[index].barWidth || secondaryTracksState[index].isLeftArrowDisabled}
            />
        </div>
        <div className="TrackMixer-barArrow TrackMixer-barArrow--right">
          <Button
            type="link"
            size="small"
            icon={<CaretRightOutlined />}
            onMouseDown={() => handleTrackBarArrowMouseDown(index, 1)}
            onMouseUp={() => handleTrackBarArrowMouseUp()}
            disabled={!secondaryTracksState[index].barWidth || secondaryTracksState[index].isRightArrowDisabled}
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
          <div className="TrackMixer-barRowDuration">
            <span>{formatMillisecondsAsDuration(0)}</span>
            <span>{formatMillisecondsAsDuration(mainTrackDurationInMs)}</span>
          </div>
          <div className="TrackMixer-bar" ref={mainTrackBarRef} />
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

import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import MediaPlayerTrack from './media-player-track.js';
import { multitrackMediaSourcesShape } from '../../ui/default-prop-types.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE } from '../../domain/constants.js';

const createInitialTrackStates = sources => ({
  mainTrack: {
    name: sources.mainTrack.name,
    sourceUrl: sources.mainTrack.sourceUrl,
    playbackRange: sources.mainTrack.playbackRange,
    volume: sources.mainTrack.volume,
    duration: 0,
    currentTimecode: 0,
    currentPlayState: MEDIA_PLAY_STATE.initializing
  },
  secondaryTracks: sources.secondaryTracks.map(track => ({
    name: track.name,
    sourceUrl: track.sourceUrl,
    volume: track.volume,
    duration: 0,
    currentTimecode: 0,
    currentPlayState: MEDIA_PLAY_STATE.initializing
  }))
});

const updateTrackNamesAndVolumes = (previousTrackStates, newSources) => ({
  ...previousTrackStates,
  mainTrack: {
    ...previousTrackStates.mainTrack,
    name: newSources.mainTrack.name,
    volume: newSources.mainTrack.volume
  },
  secondaryTracks: previousTrackStates.secondaryTracks.map((track, index) => ({
    ...track,
    name: newSources.secondaryTracks[index].name,
    volume: newSources.secondaryTracks[index].volume
  }))
});

function MediaPlayerTrackGroup({
  aspectRatio,
  screenMode,
  screenOverlay,
  volume,
  posterImageUrl,
  loadImmediately,
  trackRef,
  playbackRate,
  onDuration,
  onProgress,
  onEndReached,
  onPlayStateChange,
  sources
}) {
  const [trackStates, setTrackStates] = useState(createInitialTrackStates(sources));
  const trackRefs = useRef({
    mainTrack: { current: null },
    secondaryTracks: sources.secondaryTracks.map(() => ({ current: null }))
  });

  trackRef.current = {
    seekToPosition(trackPosition) {
      const result = trackRefs.current.mainTrack.current.seekToPosition(trackPosition);
      trackRefs.current.secondaryTracks.forEach(track => track.current.seekToPosition(trackPosition));
      return result;
    },
    seekToTimecode(trackTimecode) {
      const result = trackRefs.current.mainTrack.current.seekToTimecode(trackTimecode);
      trackRefs.current.secondaryTracks.forEach(track => track.current.seekToTimecode(trackTimecode));
      return result;
    },
    play() {
      const result = trackRefs.current.mainTrack.current.play();
      trackRefs.current.secondaryTracks.forEach(track => track.current.play());
      return result;
    },
    pause() {
      const result = trackRefs.current.mainTrack.current.pause();
      trackRefs.current.secondaryTracks.forEach(track => track.current.pause());
      return result;
    },
    stop() {
      const result = trackRefs.current.mainTrack.current.stop();
      trackRefs.current.secondaryTracks.forEach(track => track.current.stop());
      return result;
    }
  };

  const reinitialize = useCallback(newSources => {
    trackRefs.current.mainTrack.current.stop();
    trackRefs.current.secondaryTracks.forEach(track => track.current.stop());
    setTrackStates(createInitialTrackStates(newSources));
  }, [trackRefs, setTrackStates]);

  useEffect(() => {
    if (
      sources.mainTrack.sourceUrl !== trackStates.mainTrack.sourceUrl
      || sources.mainTrack.playbackRange.join() !== trackStates.mainTrack.playbackRange.join()
      || sources.secondaryTracks.length !== trackStates.secondaryTracks.length
      || sources.secondaryTracks.map(track => track.sourceUrl).join() !== trackStates.secondaryTracks.map(track => track.sourceUrl).join()
    ) {
      reinitialize(sources);
      return;
    }

    const updatedStates = updateTrackNamesAndVolumes(trackStates, sources);
    if (!deepEqual(trackStates, updatedStates)) {
      setTrackStates(updatedStates);
    }
  }, [sources, trackStates, reinitialize]);

  const setDurations = (mainTrackDuration, secondaryTrackDurations) => {
    setTrackStates(prev => ({
      mainTrack: {
        ...prev.mainTrack,
        duration: mainTrackDuration
      },
      secondaryTracks: prev.secondaryTracks.map((track, index) => ({
        ...track,
        duration: secondaryTrackDurations[index]
      }))
    }));

    if (!!mainTrackDuration && secondaryTrackDurations.every(x => !!x)) {
      onDuration(mainTrackDuration);
    }
  };

  const handleMainTrackDuration = duration => {
    setDurations(duration, trackStates.secondaryTracks.map(track => track.duration));
  };

  const handleSecondaryTrackDuration = (duration, trackIndex) => {
    setDurations(
      trackStates.mainTrack.duration,
      trackStates.secondaryTracks.map((track, index) => index === trackIndex ? duration : track.duration)
    );
  };

  const handleMainTrackEndReached = () => {
    trackRefs.current.secondaryTracks.forEach(track => track.current.stop());
    onEndReached();
  };

  const handleMainTrackProgress = progress => {
    setTrackStates(prev => ({
      ...prev,
      mainTrack: {
        ...prev.mainTrack,
        currentTimecode: progress
      }
    }));

    onProgress(progress);
  };

  const handleSecondaryTrackProgress = (progress, trackIndex) => {
    setTrackStates(prev => ({
      ...prev,
      secondaryTracks: prev.secondaryTracks.map((track, index) => ({
        ...track,
        currentTimecode: index === trackIndex ? progress : track.currentTimecode
      }))
    }));
  };

  const handleMainTrackPlayStateChange = newPlayState => {
    setTrackStates(prev => ({
      ...prev,
      mainTrack: {
        ...prev.mainTrack,
        currentPlayState: newPlayState
      }
    }));

    onPlayStateChange(newPlayState);
  };

  const handleSecondaryTrackPlayStateChange = (newPlayState, trackIndex) => {
    setTrackStates(prev => ({
      ...prev,
      secondaryTracks: prev.secondaryTracks.map((track, index) => ({
        ...track,
        currentPlayState: index === trackIndex ? newPlayState : track.currentPlayState
      }))
    }));
  };

  return (
    <Fragment>
      <MediaPlayerTrack
        key={`${trackStates.mainTrack.sourceUrl}|${trackStates.mainTrack.playbackRange.toString()}`}
        trackRef={trackRefs.current.mainTrack}
        volume={volume * trackStates.mainTrack.volume}
        sourceUrl={trackStates.mainTrack.sourceUrl}
        aspectRatio={aspectRatio}
        screenMode={screenMode}
        screenOverlay={screenOverlay}
        playbackRange={trackStates.mainTrack.playbackRange}
        playbackRate={playbackRate}
        posterImageUrl={posterImageUrl}
        loadImmediately={!!trackStates.secondaryTracks.length || loadImmediately}
        onDuration={handleMainTrackDuration}
        onEndReached={handleMainTrackEndReached}
        onProgress={handleMainTrackProgress}
        onPlayStateChange={handleMainTrackPlayStateChange}
        />
      {trackStates.secondaryTracks.map((track, index) => (
        <MediaPlayerTrack
          key={`${track.sourceUrl}|${index.toString()}`}
          trackRef={trackRefs.current.secondaryTracks[index]}
          volume={volume * track.volume}
          sourceUrl={track.sourceUrl}
          screenMode={MEDIA_SCREEN_MODE.none}
          playbackRate={playbackRate}
          loadImmediately
          onDuration={newDuration => handleSecondaryTrackDuration(newDuration, index)}
          onProgress={newProgress => handleSecondaryTrackProgress(newProgress, index)}
          onPlayStateChange={newPlayState => handleSecondaryTrackPlayStateChange(newPlayState, index)}
          />
      ))}
    </Fragment>
  );
}

MediaPlayerTrackGroup.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  loadImmediately: PropTypes.bool,
  onDuration: PropTypes.func,
  onEndReached: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)).isRequired,
  screenOverlay: PropTypes.node,
  sources: multitrackMediaSourcesShape.isRequired,
  trackRef: PropTypes.shape({
    current: PropTypes.any
  }),
  volume: PropTypes.number
};

MediaPlayerTrackGroup.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  loadImmediately: false,
  onDuration: () => {},
  onEndReached: () => {},
  onPlayStateChange: () => {},
  onProgress: () => {},
  playbackRate: 1,
  posterImageUrl: null,
  screenOverlay: null,
  trackRef: {
    current: null
  },
  volume: 1
};

export default MediaPlayerTrackGroup;

import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import { useService } from '../container-context.js';
import MediaPlayerTrack from './media-player-track.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getResourceType } from '../../utils/resource-utils.js';
import { getMediaSourceType } from '../../utils/media-utils.js';
import PreloadingMediaPlayerTrack from './preloading-media-player-track.js';
import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE, RESOURCE_TYPE } from '../../domain/constants.js';

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

const haveMediaTracksChanged = (currentTrackStates, newSources) => {
  if (
    newSources.mainTrack.sourceUrl !== currentTrackStates.mainTrack.sourceUrl
    || newSources.mainTrack.playbackRange[0] !== currentTrackStates.mainTrack.playbackRange[0]
    || newSources.mainTrack.playbackRange[1] !== currentTrackStates.mainTrack.playbackRange[1]
    || newSources.secondaryTracks.length !== currentTrackStates.secondaryTracks.length
  ) {
    return true;
  }

  for (let i = 0; i < currentTrackStates.secondaryTracks.length; i += 1) {
    const newSourceSecondaryTrack = newSources.secondaryTracks[i];
    const currentSecondaryTrackState = currentTrackStates.secondaryTracks[i];
    if (newSourceSecondaryTrack.sourceUrl !== currentSecondaryTrackState.sourceUrl) {
      return true;
    }
  }

  return false;
};

const updateTrackNamesAndVolumes = (currentTrackStates, newSources) => ({
  ...currentTrackStates,
  mainTrack: {
    ...currentTrackStates.mainTrack,
    name: newSources.mainTrack.name,
    volume: newSources.mainTrack.volume
  },
  secondaryTracks: currentTrackStates.secondaryTracks.map((track, index) => ({
    ...track,
    name: newSources.secondaryTracks[index].name,
    volume: newSources.secondaryTracks[index].volume
  }))
});

function MediaPlayerTrackGroup({
  aspectRatio,
  screenMode,
  screenWidth,
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
  const clientConfig = useService(ClientConfig);
  const [trackStates, setTrackStates] = useState(createInitialTrackStates(sources));

  const cdnRootUrl = clientConfig.cdnRootUrl;
  const isMultitrack = !!trackStates.secondaryTracks.length;

  const trackRefs = useRef({
    mainTrack: { current: null },
    secondaryTracks: sources.secondaryTracks.map(() => ({ current: null }))
  });

  const syncSecondaryTracks = (targetTimecode, shouldPlayIfPossible) => {
    for (let i = 0; i < trackStates.secondaryTracks.length; i += 1) {
      const secondaryTrackState = trackStates.secondaryTracks[i];
      const secondaryTrackRef = trackRefs.current.secondaryTracks[i];
      const canPlayAtTargetTimecode = secondaryTrackState.duration > targetTimecode;
      if (canPlayAtTargetTimecode) {
        secondaryTrackRef.current.seekToTimecode(targetTimecode);
        if (shouldPlayIfPossible) {
          secondaryTrackRef.current.play();
        } else {
          secondaryTrackRef.current.pause();
        }
      } else {
        secondaryTrackRef.current.stop();
      }
    }
  };

  trackRef.current = {
    seekToPosition(trackPosition) {
      const isPlaying = trackStates.mainTrack.currentPlayState === MEDIA_PLAY_STATE.playing;
      const result = trackRefs.current.mainTrack.current.seekToPosition(trackPosition);
      syncSecondaryTracks(result.trackTimecode, isPlaying);
      return result;
    },
    seekToTimecode(trackTimecode) {
      const isPlaying = trackStates.mainTrack.currentPlayState === MEDIA_PLAY_STATE.playing;
      const result = trackRefs.current.mainTrack.current.seekToTimecode(trackTimecode);
      syncSecondaryTracks(result.trackTimecode, isPlaying);
      return result;
    },
    play() {
      const currentMainTimecode = trackStates.mainTrack.currentTimecode;
      const result = trackRefs.current.mainTrack.current.play();
      syncSecondaryTracks(result.hasRestarted ? 0 : currentMainTimecode, true);
      return result;
    },
    pause() {
      const currentMainTimecode = trackStates.mainTrack.currentTimecode;
      const result = trackRefs.current.mainTrack.current.pause();
      syncSecondaryTracks(currentMainTimecode, false);
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
    trackRefs.current = {
      mainTrack: { current: null },
      secondaryTracks: newSources.secondaryTracks.map(() => ({ current: null }))
    };
    setTrackStates(createInitialTrackStates(newSources));
  }, [trackRefs, setTrackStates]);

  useEffect(() => {
    if (haveMediaTracksChanged(trackStates, sources)) {
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

  const getTrackComponent = sourceUrl => {
    const isAudioFile = getResourceType(sourceUrl) === RESOURCE_TYPE.audio;
    const isInternalFile = getMediaSourceType({ sourceUrl, cdnRootUrl }) === MEDIA_SOURCE_TYPE.internal;
    return isMultitrack && isInternalFile && isAudioFile ? PreloadingMediaPlayerTrack : MediaPlayerTrack;
  };

  const renderMainTrack = () => {
    const TrackComponent = getTrackComponent(trackStates.mainTrack.sourceUrl);
    return (
      <TrackComponent
        key={`${trackStates.mainTrack.sourceUrl}|${trackStates.mainTrack.playbackRange.toString()}`}
        trackRef={trackRefs.current.mainTrack}
        volume={volume * trackStates.mainTrack.volume}
        sourceUrl={trackStates.mainTrack.sourceUrl}
        aspectRatio={aspectRatio}
        screenMode={screenMode}
        screenWidth={screenWidth}
        screenOverlay={screenOverlay}
        playbackRange={trackStates.mainTrack.playbackRange}
        playbackRate={playbackRate}
        posterImageUrl={posterImageUrl}
        loadImmediately={isMultitrack || loadImmediately}
        onDuration={handleMainTrackDuration}
        onEndReached={handleMainTrackEndReached}
        onProgress={handleMainTrackProgress}
        onPlayStateChange={handleMainTrackPlayStateChange}
        />
    );
  };

  const renderSecondaryTrack = (track, index) => {
    const TrackComponent = getTrackComponent(track.sourceUrl);
    return (
      <TrackComponent
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
    );
  };

  return (
    <Fragment>
      {renderMainTrack()}
      {trackStates.secondaryTracks.map(renderSecondaryTrack)}
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
  screenWidth: PropTypes.number,
  sources: PropTypes.shape({
    mainTrack: PropTypes.shape({
      name: PropTypes.string,
      sourceUrl: PropTypes.string.isRequired,
      volume: PropTypes.number.isRequired,
      playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
    }),
    secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      sourceUrl: PropTypes.string.isRequired,
      volume: PropTypes.number.isRequired
    }))
  }).isRequired,
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
  screenWidth: 100,
  trackRef: {
    current: null
  },
  volume: 1
};

export default MediaPlayerTrackGroup;

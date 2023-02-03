import { Spin } from 'antd';
import PropTypes from 'prop-types';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import TrackMixerDisplay from './track-mixer-display.js';
import MediaPlayerControls from './media-player-controls.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE } from '../../domain/constants.js';

const sourcesCanBeConsideredEqual = (source1, source2) => {
  if (!source1 || !source2 || source1 === source2) {
    return source1 === source2;
  }

  return source1.mainTrack.sourceUrl === source2.mainTrack.sourceUrl
    && source1.mainTrack.aspectRatio === source2.mainTrack.aspectRatio
    && source1.mainTrack.playbackRange[0] === source2.mainTrack.playbackRange[0]
    && source1.mainTrack.playbackRange[1] === source2.mainTrack.playbackRange[1]
    && source1.mainTrack.showVideo === source2.mainTrack.showVideo
    && source1.secondaryTracks.length === source2.secondaryTracks.length
    && source1.secondaryTracks.every((track, index) => track.sourceUrl === source2.secondaryTracks[index].sourceUrl);
};

function MultitrackMediaPlayer({
  customUnderScreenContent,
  initialVolume,
  multitrackMediaPlayerRef,
  parts,
  posterImageUrl,
  screenWidth,
  selectedVolumePresetIndex,
  showTrackMixer,
  sources,
  volumePresets,
  onEnded,
  onPause,
  onPlay
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackStates, setTrackStates] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastSources, setLastSources] = useState(null);
  const [trackVolumes, setTrackVolumes] = useState([]);
  const [mixVolume, setMixVolume] = useState(initialVolume);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [internalSelectedVolumePresetIndex, setInternalSelectedVolumePresetIndex] = useState(0);

  const isReady = useMemo(() => trackStates.every(ts => ts.isReady), [trackStates]);
  const appliedSelectedVolumePresetIndex = selectedVolumePresetIndex ?? internalSelectedVolumePresetIndex;

  const trackRefs = useRef({});
  const { t } = useTranslation('multitrackMediaPlayer');

  const getTrackRef = key => {
    let trackRef = trackRefs.current[key];
    if (!trackRef) {
      trackRef = { current: null };
      trackRefs.current[key] = trackRef;
    }
    return trackRef;
  };

  useEffect(() => {
    setMixVolume(initialVolume);
  }, [initialVolume]);

  useEffect(() => {
    if (sourcesCanBeConsideredEqual(sources, lastSources)) {
      return;
    }

    const newStates = [
      {
        key: uniqueId.create(),
        name: sources.mainTrack.name,
        isMainTrack: true,
        isReady: false,
        durationInMilliseconds: 0,
        sourceUrl: sources.mainTrack.sourceUrl,
        aspectRatio: sources.mainTrack.aspectRatio,
        playbackRange: sources.mainTrack.playbackRange,
        screenMode: sources.mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none
      },
      ...sources.secondaryTracks.map(secondaryTrack => ({
        key: uniqueId.create(),
        name: secondaryTrack.name,
        isMainTrack: false,
        isReady: false,
        durationInMilliseconds: 0,
        sourceUrl: secondaryTrack.sourceUrl,
        aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
        playbackRange: [0, 1],
        screenMode: MEDIA_SCREEN_MODE.none
      }))
    ];

    setPlaybackRate(1);
    setLastSources(sources);
    setTrackStates(newStates);
  }, [sources, lastSources]);

  useEffect(() => {
    const currentKeys = trackStates.map(trackState => trackState.key);
    trackRefs.current = Object.fromEntries(Object.entries(trackRefs.current).filter(([key]) => currentKeys.contains(key)));
  }, [trackStates]);

  useEffect(() => {
    setTrackVolumes([volumePresets[appliedSelectedVolumePresetIndex].mainTrack, ...volumePresets[appliedSelectedVolumePresetIndex].secondaryTracks]);
  }, [volumePresets, appliedSelectedVolumePresetIndex]);

  const triggerPlayMainTrack = () => {
    const mainTrack = trackStates.find(trackState => trackState.isMainTrack);
    getTrackRef(mainTrack.key).current.play();
  };

  const triggerSeekToPartAll = partIndex => {
    const mainDuration = trackStates.find(ts => ts.isMainTrack).durationInMilliseconds;
    const partStartTimecode = (parts[partIndex]?.startPosition || 0) * mainDuration;
    trackStates.forEach(trackState => {
      getTrackRef(trackState.key).current.seekToTimecode(partStartTimecode);
    });
  };

  const triggerPlayAll = () => {
    trackStates.forEach(trackState => {
      if (trackState.isMainTrack || playedMilliseconds < trackState.durationInMilliseconds) {
        getTrackRef(trackState.key).current.play();
      }
    });
  };

  const triggerPauseAll = () => {
    Object.values(trackRefs.current).forEach(trackRef => trackRef.current.pause());
  };

  const triggerStopAllSecondaryTracks = () => {
    trackStates.forEach(trackState => {
      if (!trackState.isMainTrack) {
        getTrackRef(trackState.key).current.stop();
      }
    });
  };

  const handleReady = key => {
    setTrackStates(previousTrackStates => {
      const newTrackStates = cloneDeep(previousTrackStates);
      const trackState = newTrackStates.find(ts => ts.key === key);
      trackState.isReady = true;
      return newTrackStates;
    });
  };

  const handleDuration = (newDurationInMilliseconds, key) => {
    setTrackStates(previousTrackStates => {
      const newTrackStates = cloneDeep(previousTrackStates);
      const trackState = newTrackStates.find(ts => ts.key === key);
      trackState.durationInMilliseconds = newDurationInMilliseconds;
      return newTrackStates;
    });
  };

  const handleMainTrackProgress = newProgressInMilliseconds => {
    setPlayedMilliseconds(newProgressInMilliseconds);

    if (isSeeking) {
      trackStates.forEach(trackState => {
        if (!trackState.isMainTrack) {
          getTrackRef(trackState.key).current.seekToTimecode(newProgressInMilliseconds);
        }
      });
    }
  };

  const handleMainTrackPlay = () => {
    onPlay();
    triggerPlayAll();
    setIsPlaying(true);
  };

  const handleMainTrackPause = () => {
    onPause();
    triggerPauseAll();
    setIsPlaying(false);
  };

  const handleMainTrackEnded = () => {
    onEnded();
    setIsPlaying(false);
    // Stop only secondary tracks, as to not reset progress to 0.
    // Main track is internally (at player level) paused within range, not stopped.
    triggerStopAllSecondaryTracks();
  };

  const handleMainTrackSeekStart = () => {
    setIsSeeking(true);
  };

  const handleMainTrackSeekEnd = () => {
    setIsSeeking(false);
  };

  const renderControls = () => {
    return (
      <div>
        <MediaPlayerControls
          volume={mixVolume}
          isPlaying={isPlaying}
          screenMode={trackStates[0]?.screenMode}
          playedMilliseconds={playedMilliseconds}
          durationInMilliseconds={trackStates[0]?.durationInMilliseconds || 0}
          onVolumeChange={setMixVolume}
          onPlayClick={triggerPlayAll}
          onPauseClick={triggerPauseAll}
          onPlaybackRateChange={setPlaybackRate}
          />
        {!!showTrackMixer && trackStates.length > 1 && (
        <div className="MultitrackMediaPlayer-trackMixerDisplay">
          <TrackMixerDisplay
            tracks={trackStates}
            volumes={trackVolumes}
            volumePresets={volumePresets}
            selectedVolumePresetIndex={appliedSelectedVolumePresetIndex}
            onVolumesChange={setTrackVolumes}
            onSelectedVolumePresetIndexChange={setInternalSelectedVolumePresetIndex}
            />
        </div>
        )}
        {!isReady && (
          <div className="MultitrackMediaPlayer-loadingOverlay">
            <Spin />
          </div>
        )}
      </div>
    );
  };

  multitrackMediaPlayerRef.current = {
    play: triggerPlayMainTrack,
    seekToPart: triggerSeekToPartAll
  };

  const allSourcesAreSet = trackStates.every(trackState => !!trackState.sourceUrl);

  if (!allSourcesAreSet) {
    return (
      <div className="MultitrackMediaPlayer">
        <div className="MultitrackMediaPlayer-errorMessage">{t('missingSourcesMessage')}</div>
      </div>
    );
  }

  return (
    <div>
      {trackStates.map((trackState, trackIndex) => (
        <MediaPlayer
          key={trackState.key}
          aspectRatio={trackState.aspectRatio}
          customUnderScreenContent={trackState.isMainTrack ? customUnderScreenContent : null}
          parts={parts}
          playbackRange={trackState.playbackRange}
          playbackRate={playbackRate}
          posterImageUrl={posterImageUrl}
          preload
          mediaPlayerRef={getTrackRef(trackState.key)}
          renderControls={trackState.isMainTrack ? renderControls : () => null}
          renderProgressBar={trackState.isMainTrack ? null : () => null}
          screenMode={trackState.screenMode}
          screenWidth={screenWidth}
          sourceUrl={trackState.sourceUrl}
          volume={mixVolume * trackVolumes[trackIndex]}
          onDuration={value => handleDuration(value, trackState.key)}
          onEnded={() => trackState.isMainTrack ? handleMainTrackEnded() : null}
          onPause={() => trackState.isMainTrack ? handleMainTrackPause() : null}
          onPlay={() => trackState.isMainTrack ? handleMainTrackPlay() : null}
          onProgress={value => trackState.isMainTrack ? handleMainTrackProgress(value) : null}
          onReady={() => handleReady(trackState.key)}
          onSeekEnd={() => trackState.isMainTrack ? handleMainTrackSeekEnd() : null}
          onSeekStart={() => trackState.isMainTrack ? handleMainTrackSeekStart() : null}
          />
      ))}
    </div>
  );
}

MultitrackMediaPlayer.propTypes = {
  customUnderScreenContent: PropTypes.node,
  initialVolume: PropTypes.number,
  multitrackMediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired
  })),
  posterImageUrl: PropTypes.string,
  screenWidth: PropTypes.oneOf([...Array(101).keys()]),
  selectedVolumePresetIndex: PropTypes.number,
  showTrackMixer: PropTypes.bool,
  sources: PropTypes.shape({
    mainTrack: PropTypes.shape({
      name: PropTypes.string,
      sourceUrl: PropTypes.string,
      aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
      playbackRange: PropTypes.arrayOf(PropTypes.number),
      showVideo: PropTypes.bool
    }),
    secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      sourceUrl: PropTypes.string
    }))
  }).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func
};

MultitrackMediaPlayer.defaultProps = {
  customUnderScreenContent: null,
  initialVolume: 1,
  multitrackMediaPlayerRef: {
    current: null
  },
  parts: [],
  posterImageUrl: null,
  screenWidth: 100,
  selectedVolumePresetIndex: null,
  showTrackMixer: false,
  onEnded: () => {},
  onPause: () => {},
  onPlay: () => {}
};

export default MultitrackMediaPlayer;

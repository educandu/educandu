import { Spin } from 'antd';
import PropTypes from 'prop-types';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import TrackMixerDisplay from './track-mixer-display.js';
import MediaPlayerControls from './media-player-controls.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE } from '../../domain/constants.js';

const sourcesCanBeConsideredEqual = (sources1, sources2) => {
  if (!sources1 || !sources2 || sources1 === sources2) {
    return sources1 === sources2;
  }

  return sources1.length === sources2.length
    && sources1.every((track1, index) => {
      const track2 = sources2[index];
      return track1.key === track2.key
        && track1.sourceUrl === track2.sourceUrl
        && track1.playbackRange[0] === track2.playbackRange[0]
        && track1.playbackRange[1] === track2.playbackRange[1];
    });
};

function MultitrackMediaPlayer({
  aspectRatio,
  customUnderScreenContent,
  initialVolume,
  multitrackMediaPlayerRef,
  parts,
  posterImageUrl,
  screenWidth,
  selectedVolumePresetIndex,
  showTrackMixer,
  showVideo,
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

  const screenMode = showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none;
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

    setPlaybackRate(1);
    setLastSources(sources);

    setTrackStates(prevStates => {
      const newStates = sources.map((track, index) => {
        const prevState = prevStates.find(oldTrack => sourcesCanBeConsideredEqual([oldTrack], [track]));

        return {
          key: track.key,
          name: track.name,
          sourceUrl: track.sourceUrl,
          playbackRange: track.playbackRange,
          isMainTrack: index === 0,
          isReady: prevState?.isReady || false,
          durationInMilliseconds: prevState?.durationInMilliseconds || 0
        };
      });

      return newStates;
    });
  }, [sources, lastSources]);

  useEffect(() => {
    const currentKeys = trackStates.map(trackState => trackState.key);
    trackRefs.current = Object.fromEntries(Object.entries(trackRefs.current).filter(([key]) => currentKeys.contains(key)));
  }, [trackStates]);

  useEffect(() => {
    setTrackVolumes(volumePresets[appliedSelectedVolumePresetIndex].tracks);
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
          screenMode={screenMode}
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
          aspectRatio={aspectRatio}
          customUnderScreenContent={trackState.isMainTrack ? customUnderScreenContent : null}
          parts={parts}
          playbackRange={trackState.playbackRange}
          playbackRate={playbackRate}
          posterImageUrl={posterImageUrl}
          preload
          mediaPlayerRef={getTrackRef(trackState.key)}
          renderControls={trackState.isMainTrack ? renderControls : () => null}
          renderProgressBar={trackState.isMainTrack ? null : () => null}
          screenMode={trackState.isMainTrack ? screenMode : MEDIA_SCREEN_MODE.none}
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
  showVideo: PropTypes.bool,
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  sources: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    tracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func
};

MultitrackMediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
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
  showVideo: true,
  onEnded: () => {},
  onPause: () => {},
  onPlay: () => {}
};

export default MultitrackMediaPlayer;

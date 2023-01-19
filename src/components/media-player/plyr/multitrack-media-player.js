import PropTypes from 'prop-types';
import MediaPlayer from './media-player.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../../utils/unique-id.js';
import cloneDeep from '../../../utils/clone-deep.js';
import TrackMixerDisplay from '../track-mixer-display.js';
import React, { useEffect, useRef, useState } from 'react';
import MediaPlayerControls from '../media-player-controls.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE } from '../../../domain/constants.js';

function MultitrackMediaPlayer({
  sources,
  screenWidth,
  volumePresets,
  selectedVolumePresetIndex,
  showTrackMixer,
  onReady
}) {
  const [mixVolume, setMixVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackStates, setTrackStates] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trackVolumes, setTrackVolumes] = useState([]);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [internalSelectedVolumePresetIndex, setInternalSelectedVolumePresetIndex] = useState(0);

  const trackRefs = useRef({});
  const { t } = useTranslation('multitrackMediaPlayer');

  const appliedSelectedVolumePresetIndex = selectedVolumePresetIndex ?? internalSelectedVolumePresetIndex;

  const getTrackRef = key => {
    let trackRef = trackRefs.current[key];
    if (!trackRef) {
      trackRef = { current: null };
      trackRefs.current[key] = trackRef;
    }
    return trackRef;
  };

  useEffect(() => {
    const newStates = [
      {
        key: uniqueId.create(),
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
        isMainTrack: false,
        isReady: false,
        durationInMilliseconds: 0,
        sourceUrl: secondaryTrack.sourceUrl,
        aspectRatio: null,
        playbackRange: null,
        screenMode: MEDIA_SCREEN_MODE.none
      }))
    ];

    setPlaybackRate(1);
    setTrackStates(newStates);
  }, [sources]);

  useEffect(() => {
    const currentKeys = trackStates.map(trackState => trackState.key);
    trackRefs.current = Object.fromEntries(Object.entries(trackRefs.current).filter(([key]) => currentKeys.contains(key)));
  }, [trackStates]);

  useEffect(() => {
    setTrackVolumes([volumePresets[appliedSelectedVolumePresetIndex].mainTrack, ...volumePresets[appliedSelectedVolumePresetIndex].secondaryTracks]);
  }, [volumePresets, appliedSelectedVolumePresetIndex]);

  const triggerPlay = () => {
    trackStates.forEach(trackState => {
      if (trackState.isMainTrack || playedMilliseconds < trackState.durationInMilliseconds) {
        getTrackRef(trackState.key).current.play();
      }
    });
  };

  const triggerPause = () => {
    Object.values(trackRefs.current).forEach(trackRef => trackRef.current.pause());
  };

  const triggerStop = () => {
    Object.values(trackRefs.current).forEach(trackRef => trackRef.current.stop());
  };

  const handleReady = key => {
    setTrackStates(previousTrackStates => {
      const newTrackStates = cloneDeep(previousTrackStates);
      const trackState = newTrackStates.find(ts => ts.key === key);
      trackState.isReady = true;

      if (newTrackStates.every(ts => ts.isReady)) {
        onReady();
      }

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
    triggerPlay();
    setIsPlaying(true);
  };

  const handleMainTrackPause = () => {
    triggerPause();
    setIsPlaying(false);
  };

  const handleMainTrackEnded = () => {
    triggerStop();
    setIsPlaying(false);
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
          onPlayClick={triggerPlay}
          onPauseClick={triggerPause}
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
      </div>
    );
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
          preload
          key={trackState.key}
          volume={mixVolume * trackVolumes[trackIndex]}
          playbackRate={playbackRate}
          screenWidth={screenWidth}
          sourceUrl={trackState.sourceUrl}
          screenMode={trackState.screenMode}
          aspectRatio={trackState.aspectRatio}
          playbackRange={trackState.playbackRange}
          renderControls={trackState.isMainTrack ? renderControls : () => null}
          renderProgressBar={trackState.isMainTrack ? null : () => null}
          mediaPlayerRef={getTrackRef(trackState.key)}
          onReady={() => handleReady(trackState.key)}
          onDuration={value => handleDuration(value, trackState.key)}
          onProgress={value => trackState.isMainTrack ? handleMainTrackProgress(value) : null}
          onPlay={() => trackState.isMainTrack ? handleMainTrackPlay() : null}
          onPause={() => trackState.isMainTrack ? handleMainTrackPause() : null}
          onEnded={() => trackState.isMainTrack ? handleMainTrackEnded() : null}
          onSeekStart={() => trackState.isMainTrack ? handleMainTrackSeekStart() : null}
          onSeekEnd={() => trackState.isMainTrack ? handleMainTrackSeekEnd() : null}
          />
      ))}
    </div>
  );
}

MultitrackMediaPlayer.propTypes = {
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
  screenWidth: PropTypes.oneOf([...Array(101).keys()]),
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  selectedVolumePresetIndex: PropTypes.number,
  showTrackMixer: PropTypes.bool,
  onReady: PropTypes.func
};

MultitrackMediaPlayer.defaultProps = {
  screenWidth: 100,
  showTrackMixer: false,
  selectedVolumePresetIndex: null,
  onReady: () => {}
};

export default MultitrackMediaPlayer;

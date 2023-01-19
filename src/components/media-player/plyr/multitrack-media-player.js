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
  screenWidth,
  selectedVolumePresetIndex,
  showTrackMixer,
  sources,
  volumePresets,
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
        aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
        playbackRange: [0, 1],
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
          key={trackState.key}
          aspectRatio={trackState.aspectRatio}
          playbackRange={trackState.playbackRange}
          playbackRate={playbackRate}
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
  onReady: PropTypes.func
};

MultitrackMediaPlayer.defaultProps = {
  screenWidth: 100,
  selectedVolumePresetIndex: null,
  showTrackMixer: false,
  onReady: () => {}
};

export default MultitrackMediaPlayer;

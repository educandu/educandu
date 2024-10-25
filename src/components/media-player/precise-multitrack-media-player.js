import { Spin } from 'antd';
import PropTypes from 'prop-types';
import deepEqual from 'fast-deep-equal';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { handleError } from '../../ui/error-helper.js';
import TrackMixerDisplay from './track-mixer-display.js';
import EmptyState, { EMPTY_STATE_STATUS } from '../empty-state.js';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaDownloader, useRunningAudioContextProvider } from './media-hooks.js';
import { MultitrackAudioPlayer, PLAY_STATE, STATE } from '@educandu/multitrack-audio-player';
import MediaPlayerControls, { MEDIA_PLAYER_CONTROLS_STATE } from './media-player-controls.js';

const logger = new Logger(import.meta.url);

const tracksCanBeConsideredEqual = (config1, config2) => {
  if (!config1 || !config2 || config1 === config2) {
    return config1 === config2;
  }

  return config1.tracks.length === config2.tracks.length
    && config1.tracks.every((track1, index) => {
      const track2 = config2.tracks[index];
      return track1.customProps.key === track2.customProps.key
        && track1.sourceUrl === track2.sourceUrl
        && track1.playbackRange[0] === track2.playbackRange[0]
        && track1.playbackRange[1] === track2.playbackRange[1]
        && deepEqual(track1.customProps, track2.customProps);
    });
};

const adjustPlayerGainValues = (oldPlayer, newPlayerConfiguration) => {
  oldPlayer.gainParams = newPlayerConfiguration.gainParams;
  for (let i = 0; i < oldPlayer.tracks.length; i += 1) {
    oldPlayer.tracks[i].gainParams = newPlayerConfiguration.trackConfiguration.tracks[i].gainParams;
  }
};

const createPlayerConfiguration = ({
  sources,
  mixVolume,
  trackVolumes,
  mediaDownloader,
  audioContextProvider

}) => {
  return {
    trackConfiguration: {
      tracks: sources.map((source, sourceIndex) => ({
        sourceUrl: source.sourceUrl,
        playbackRange: source.playbackRange,
        gainParams: { gain: trackVolumes[sourceIndex] ?? 1, mute: false },
        customProps: {
          key: source.key,
          name: source.name,
          isMainTrack: sourceIndex === 0
        }
      })),
      soloTrackIndex: -1
    },
    autoInitialize: true,
    gainParams: { gain: mixVolume, mute: false },
    mediaDownloader,
    audioContextProvider
  };
};

function PreciseMultitrackMediaPlayer({
  allowLoop,
  initialVolume,
  selectedVolumePresetIndex,
  showTrackMixer,
  sources,
  volumePresets
}) {
  const [, setSemaphore] = useState(0);
  const mediaDownloader = useMediaDownloader();
  const [loopMedia, setLoopMedia] = useState(false);
  const [mixVolume, setMixVolume] = useState(initialVolume);
  const { t } = useTranslation('preciseMultitrackMediaPlayer');
  const audioContextProvider = useRunningAudioContextProvider();
  const [internalSelectedVolumePresetIndex, setInternalSelectedVolumePresetIndex] = useState(0);

  const appliedSelectedVolumePresetIndex = selectedVolumePresetIndex ?? internalSelectedVolumePresetIndex;
  const [trackVolumes, setTrackVolumes] = useState(volumePresets[appliedSelectedVolumePresetIndex].tracks);

  const currentPlayerRef = useRef(null);
  const currentPlayer = currentPlayerRef.current;
  const wasCurrentPlayerPlayClicked = useRef(false);

  const handleVolumeChange = newVolume => {
    setMixVolume(newVolume);
    currentPlayer.gainParams = { ...currentPlayer.gainParams, gain: newVolume };
  };

  const handlePlayerStateChanged = useCallback(newState => {
    if (newState === STATE.initialized && wasCurrentPlayerPlayClicked.current) {
      currentPlayerRef.current.load();
    }

    if (newState === STATE.ready && wasCurrentPlayerPlayClicked.current) {
      currentPlayerRef.current.start();
    }

    if (newState === STATE.faulted) {
      const error = new Error(currentPlayerRef.current.error);
      handleError({ message: error.message, error, logger, t });
    }

    setSemaphore(oldValue => oldValue + 1);
  }, [t]);

  const handlePlayerPlayStateChanged = useCallback(() => {
    setSemaphore(oldValue => oldValue + 1);
  }, []);

  const handlePlayerPositionChanged = useCallback(() => {
    setSemaphore(oldValue => oldValue + 1);
  }, []);

  useEffect(() => {
    setMixVolume(initialVolume);
  }, [initialVolume]);

  useEffect(() => {
    setTrackVolumes(volumePresets[appliedSelectedVolumePresetIndex].tracks);
  }, [appliedSelectedVolumePresetIndex, volumePresets]);

  const [playerConfiguration, setPlayerConfiguration] = useState(createPlayerConfiguration({
    sources,
    mixVolume,
    trackVolumes,
    mediaDownloader,
    audioContextProvider
  }));

  useEffect(() => {
    const newPlayerConfig = createPlayerConfiguration({
      sources,
      mixVolume,
      trackVolumes,
      mediaDownloader,
      audioContextProvider
    });

    setPlayerConfiguration(newPlayerConfig);
  }, [sources, mixVolume, trackVolumes, mediaDownloader, audioContextProvider]);

  useEffect(() => {
    const oldPlayer = currentPlayerRef.current;
    const oldTrackConfiguration = oldPlayer?.trackConfiguration;
    const newTrackConfiguration = playerConfiguration.trackConfiguration;
    if (tracksCanBeConsideredEqual(oldTrackConfiguration, newTrackConfiguration)) {
      adjustPlayerGainValues(oldPlayer, playerConfiguration);
      return;
    }

    if (oldPlayer) {
      setTimeout(() => oldPlayer.dispose(), 0);
    }

    currentPlayerRef.current = new MultitrackAudioPlayer({
      ...playerConfiguration,
      onStateChanged: handlePlayerStateChanged,
      onPlayStateChanged: handlePlayerPlayStateChanged,
      onPositionChanged: handlePlayerPositionChanged
    });

    wasCurrentPlayerPlayClicked.current = false;

  }, [playerConfiguration, handlePlayerPlayStateChanged, handlePlayerPositionChanged, handlePlayerStateChanged]);

  const handleVolumesChange = newVolumes => {
    setTrackVolumes(newVolumes);

    for (let i = 0; i < currentPlayer.tracks.length; i += 1) {
      currentPlayer.tracks[i].gainParams = {
        ...currentPlayer.tracks[i].gainParams,
        gain: newVolumes[i]
      };
    }
  };

  const handleSelectedVolumePresetIndexChange = newIndex => {
    setInternalSelectedVolumePresetIndex(newIndex);
  };

  const handlePlayClick = () => {
    wasCurrentPlayerPlayClicked.current = true;

    if (!audioContextProvider.value) {
      audioContextProvider.resume();
    }

    if (currentPlayer.state === STATE.initialized) {
      currentPlayer.load();
    } else if (currentPlayer.state === STATE.ready) {
      currentPlayer.start();
    }
  };

  const handlePauseClick = () => {
    currentPlayer.pause();
  };

  const handleLoopMediaChange = newLoopMedia => {
    setLoopMedia(newLoopMedia);
  };

  const handleSeek = newPositionInMs => {
    currentPlayer.position = newPositionInMs / 1000;
  };

  const allSourcesAreSet = sources.every(source => !!source.sourceUrl);

  if (!allSourcesAreSet) {
    return (
      <div className="MultitrackMediaPlayer">
        <EmptyState
          title={t('common:cannotPlayMediaEmptyStateTitle')}
          subtitle={t('emptyStateSubtitle')}
          status={EMPTY_STATE_STATUS.error}
          />
      </div>
    );
  }

  const mediaPlayerControlsState = currentPlayer?.playState === PLAY_STATE.started
    ? MEDIA_PLAYER_CONTROLS_STATE.playing
    : MEDIA_PLAYER_CONTROLS_STATE.paused;

  const durationInMilliseconds = (currentPlayer?.duration || 0) * 1000;
  const playedMilliseconds = (currentPlayer?.position || 0) * 1000;
  const trackStates = currentPlayer?.tracks.map(track => track.customProps) || [];

  return (
    <div className="MultitrackMediaPlayer MultitrackMediaPlayer--noScreen">
      <MediaPlayerProgressBar
        durationInMilliseconds={durationInMilliseconds}
        playedMilliseconds={playedMilliseconds}
        onSeek={handleSeek}
        />
      <MediaPlayerControls
        allowLoop={allowLoop}
        volume={mixVolume}
        loopMedia={loopMedia}
        state={mediaPlayerControlsState}
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        onVolumeChange={handleVolumeChange}
        onPlayClick={handlePlayClick}
        onPauseClick={handlePauseClick}
        onLoopMediaChange={handleLoopMediaChange}
        />
      {!!showTrackMixer && trackStates.length > 1 && (
        <div className="MultitrackMediaPlayer-trackMixerDisplay">
          <TrackMixerDisplay
            tracks={trackStates}
            volumes={trackVolumes}
            volumePresets={volumePresets}
            selectedVolumePresetIndex={appliedSelectedVolumePresetIndex}
            onVolumesChange={handleVolumesChange}
            onSelectedVolumePresetIndexChange={handleSelectedVolumePresetIndexChange}
            />
        </div>
      )}
      {currentPlayer?.state === STATE.loading && (
        <div className="MultitrackMediaPlayer-loadingOverlay">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
}

PreciseMultitrackMediaPlayer.propTypes = {
  allowLoop: PropTypes.bool,
  initialVolume: PropTypes.number,
  selectedVolumePresetIndex: PropTypes.number,
  showTrackMixer: PropTypes.bool,
  sources: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    tracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired
};

PreciseMultitrackMediaPlayer.defaultProps = {
  allowLoop: false,
  initialVolume: 1,
  selectedVolumePresetIndex: null,
  showTrackMixer: false
};

export default PreciseMultitrackMediaPlayer;

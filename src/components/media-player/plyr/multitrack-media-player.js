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
  aspectRatio,
  screenMode,
  screenWidth,
  volumePresets,
  showTrackMixer,
  onReady
}) {
  const [mixVolume, setMixVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackStates, setTrackStates] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [trackSources, setTrackSources] = useState([]);
  const [trackVolumes, setTrackVolumes] = useState([]);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

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
    const newStates = [
      {
        key: uniqueId.create(),
        source: sources.mainTrack,
        durationInMilliseconds: 0,
        isMainTrack: true,
        isReady: false
      }, ...sources.secondaryTracks.map(secondaryTrack => ({
        key: uniqueId.create(),
        source: secondaryTrack,
        durationInMilliseconds: 0,
        isMainTrack: false,
        isReady: false
      }))
    ];

    setPlaybackRate(1);
    setTrackStates(newStates);
    setTrackSources(newStates.map(trackState => trackState.source));
  }, [sources]);

  useEffect(() => {
    const currentKeys = trackStates.map(trackState => trackState.key);
    trackRefs.current = Object.fromEntries(Object.entries(trackRefs.current).filter(([key]) => currentKeys.contains(key)));
  }, [trackStates]);

  useEffect(() => {
    setSelectedVolumePresetIndex(0);
  }, [sources, volumePresets]);

  useEffect(() => {
    setTrackVolumes([volumePresets[selectedVolumePresetIndex].mainTrack, ...volumePresets[selectedVolumePresetIndex].secondaryTracks]);
  }, [sources, volumePresets, selectedVolumePresetIndex]);

  const triggerPlay = () => {
    Object.values(trackRefs.current).forEach(trackRef => trackRef.current.play());
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
          screenMode={screenMode}
          playedMilliseconds={playedMilliseconds}
          durationInMilliseconds={trackStates[0]?.durationInMilliseconds || 0}
          onVolumeChange={setMixVolume}
          onPlayClick={triggerPlay}
          onPauseClick={triggerPause}
          onPlaybackRateChange={setPlaybackRate}
          />
        {!!showTrackMixer && !!sources.secondaryTracks.length && (
        <div className="MultitrackMediaPlayer-trackMixerDisplay">
          <TrackMixerDisplay
            tracks={trackSources}
            volumes={trackVolumes}
            volumePresets={volumePresets}
            selectedVolumePresetIndex={selectedVolumePresetIndex}
            onVolumesChange={setTrackVolumes}
            onSelectedVolumePresetIndexChange={setSelectedVolumePresetIndex}
            />
        </div>
        )}
      </div>
    );
  };

  const allSourcesAreSet = trackStates.every(trackState => !!trackState.source.sourceUrl);

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
          aspectRatio={aspectRatio}
          screenWidth={screenWidth}
          sourceUrl={trackState.source.sourceUrl}
          renderControls={trackState.isMainTrack ? renderControls : () => null}
          renderProgressBar={trackState.isMainTrack ? null : () => null}
          mediaPlayerRef={getTrackRef(trackState.key)}
          screenMode={trackState.isMainTrack ? screenMode : MEDIA_SCREEN_MODE.none}
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
      playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
    }),
    secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      sourceUrl: PropTypes.string
    }))
  }).isRequired,
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  screenWidth: PropTypes.oneOf([...Array(101).keys()]),
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  showTrackMixer: PropTypes.bool,
  onReady: PropTypes.func.isRequired
};

MultitrackMediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  screenMode: MEDIA_SCREEN_MODE.video,
  screenWidth: 100,
  showTrackMixer: false
};

export default MultitrackMediaPlayer;

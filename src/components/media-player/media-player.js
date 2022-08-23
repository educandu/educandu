import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useService } from '../container-context.js';
import { useDedupedCallback } from '../../ui/hooks.js';
import HttpClient from '../../api-clients/http-client.js';
import React, { useEffect, useRef, useState } from 'react';
import MediaPlayerControls from './media-player-controls.js';
import MediaPlayerTrackGroup from './media-player-track-group.js';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

const SOURCE_TYPE = {
  none: 'none',
  lazy: 'lazy',
  eager: 'eager'
};

const LAZY_LOAD_COMPLETED_ACTION = {
  none: 'none',
  play: 'play',
  download: 'download'
};

const getSourceType = source => {
  switch (typeof source) {
    case 'string':
      return SOURCE_TYPE.eager;
    case 'function':
      return SOURCE_TYPE.lazy;
    default:
      return SOURCE_TYPE.none;
  }
};

const getCurrentPositionInfo = (parts, durationInMilliseconds, playedMilliseconds) => {
  const info = { currentPartIndex: -1, isPartEndReached: false };

  let partIndex = 0;
  let shouldContinueSearching = !!durationInMilliseconds;
  while (partIndex < parts.length && shouldContinueSearching) {
    const isLastPart = partIndex === parts.length - 1;
    const startTimecode = parts[partIndex].startPosition * durationInMilliseconds;
    const endTimecode = (parts[partIndex + 1]?.startPosition || 1) * durationInMilliseconds;
    const millisecondsBeforeOrAfterEnd = Math.abs(endTimecode - playedMilliseconds);

    // The part end event for the last part will be triggered by `handleEndReached`, so we exclude it here:
    if (!isLastPart && millisecondsBeforeOrAfterEnd <= MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS) {
      info.currentPartIndex = partIndex;
      info.isPartEndReached = true;
      shouldContinueSearching = false;
    } else if (startTimecode < playedMilliseconds) {
      info.currentPartIndex = partIndex;
    } else {
      shouldContinueSearching = false;
    }

    partIndex += 1;
  }

  return info;
};

function MediaPlayer({
  source,
  playbackRange,
  aspectRatio,
  screenMode,
  screenOverlay,
  canDownload,
  downloadFileName,
  posterImageUrl,
  extraCustomContent,
  onPartEndReached,
  onEndReached,
  onPlayStateChange,
  onPlayingPartIndexChange,
  onReady,
  onSeek,
  parts,
  mediaPlayerRef
}) {
  const sourceType = getSourceType(source);

  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const httpClient = useService(HttpClient);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [lastPlayedPartIndex, setLastPlayedPartIndex] = useState(-1);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);
  const [lastReachedPartEndIndex, setLastReachedPartEndIndex] = useState(-1);
  const [sourceUrl, setSourceUrl] = useState(sourceType === SOURCE_TYPE.eager ? source : null);
  const [lazyLoadCompletedAction, setLazyLoadCompletedAction] = useState(LAZY_LOAD_COMPLETED_ACTION.none);

  const triggerReadyIfNeeded = useDedupedCallback(onReady);
  const triggerPlayStateChangeIfNeeded = useDedupedCallback(onPlayStateChange);

  useEffect(() => {
    setSourceUrl(sourceType === SOURCE_TYPE.eager ? source : null);
  }, [source, sourceType]);

  useEffect(() => {
    if (isSeeking) {
      return;
    }

    const { currentPartIndex, isPartEndReached } = getCurrentPositionInfo(parts, durationInMilliseconds, playedMilliseconds);

    if (currentPartIndex !== lastPlayedPartIndex) {
      onPlayingPartIndexChange(currentPartIndex);
      setLastPlayedPartIndex(currentPartIndex);
    }

    if (isPartEndReached && currentPartIndex !== lastReachedPartEndIndex) {
      onPartEndReached(currentPartIndex);
      setLastReachedPartEndIndex(currentPartIndex);
    }
  }, [isSeeking, parts, durationInMilliseconds, playedMilliseconds, lastPlayedPartIndex, lastReachedPartEndIndex, onPlayingPartIndexChange, onPartEndReached]);

  const handleSeek = milliseconds => {
    setLastReachedPartEndIndex(-1);
    trackRef.current.seekToTimecode(milliseconds);
    onSeek(milliseconds);
  };

  const lazyLoadSource = async completedAction => {
    setLazyLoadCompletedAction(completedAction);
    const newSourceUrl = await source();
    setSourceUrl(newSourceUrl);
  };

  const handlePlayClick = async () => {
    setLastReachedPartEndIndex(-1);
    if (!sourceUrl && sourceType === SOURCE_TYPE.lazy) {
      await lazyLoadSource(LAZY_LOAD_COMPLETED_ACTION.play);
      return;
    }

    trackRef.current.play();
  };

  const handlePauseClick = () => {
    trackRef.current.pause();
  };

  const handleEndReached = () => {
    if (!isSeeking) {
      setLastReachedPartEndIndex(-1);
      onPartEndReached(parts.length - 1);
      onEndReached();
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const handlePlaybackRateChange = newRate => {
    setPlaybackRate(newRate);
  };

  const handlePlayStateChange = newPlayState => {
    setPlayState(newPlayState);
    triggerPlayStateChangeIfNeeded(newPlayState);
  };

  const handleDownloadClick = async () => {
    if (!sourceUrl && sourceType === SOURCE_TYPE.lazy) {
      await lazyLoadSource(LAZY_LOAD_COMPLETED_ACTION.download);
    } else {
      httpClient.download(sourceUrl, downloadFileName);
    }
  };

  const handleDuration = duration => {
    setDurationInMilliseconds(duration);
    triggerReadyIfNeeded();
    switch (lazyLoadCompletedAction) {
      case LAZY_LOAD_COMPLETED_ACTION.play:
        handlePlayClick();
        break;
      case LAZY_LOAD_COMPLETED_ACTION.download:
        handleDownloadClick();
        break;
      default:
        break;
    }
  };

  mediaPlayerRef.current = {
    play: trackRef.current?.play,
    pause: trackRef.current?.pause,
    stop: trackRef.current?.stop,
    seekToPosition: position => {
      setLastReachedPartEndIndex(-1);
      const { trackPosition } = trackRef.current?.seekToPosition(position) || { trackPosition: 0 };
      onSeek(trackPosition);
    },
    seekToTimecode: timecode => {
      setLastReachedPartEndIndex(-1);
      const { trackPosition } = trackRef.current?.seekToTimecode(timecode) || { trackPosition: 0 };
      onSeek(trackPosition);
    },
    seekToPart: partIndex => {
      setLastReachedPartEndIndex(partIndex - 1);
      const { trackPosition } = trackRef.current?.seekToPosition(parts[partIndex]?.startPosition || 0) || { trackPosition: 0 };
      onSeek(trackPosition);
    },
    reset: () => {
      setLastReachedPartEndIndex(-1);
      trackRef.current?.stop();
      trackRef.current?.seekToPosition(0);
      onSeek(0);
    }
  };

  if (sourceType === SOURCE_TYPE.none) {
    return <div className="MediaPlayer" />;
  }

  return (
    <div className={classNames('MediaPlayer', { 'MediaPlayer--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
      {sourceUrl && (
        <MediaPlayerTrackGroup
          trackRef={trackRef}
          volume={volume}
          sources={{
            mainTrack: {
              name: '',
              sourceUrl,
              volume: 1,
              playbackRange
            },
            secondaryTracks: []
          }}
          aspectRatio={aspectRatio}
          screenMode={screenMode}
          screenOverlay={screenOverlay}
          playbackRate={playbackRate}
          onDuration={handleDuration}
          onEndReached={handleEndReached}
          onProgress={setPlayedMilliseconds}
          onPlayStateChange={handlePlayStateChange}
          posterImageUrl={posterImageUrl}
          loadImmediately={sourceType === SOURCE_TYPE.lazy}
          />
      )}
      {extraCustomContent && (<div>{extraCustomContent}</div>)}
      <MediaPlayerProgressBar
        parts={parts}
        onSeek={handleSeek}
        onSeekStart={handleSeekStart}
        onSeekEnd={handleSeekEnd}
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        />
      <MediaPlayerControls
        playState={playState}
        screenMode={screenMode}
        durationInMilliseconds={durationInMilliseconds}
        playedMilliseconds={playedMilliseconds}
        volume={volume}
        onPlayClick={handlePlayClick}
        onPauseClick={handlePauseClick}
        onPlaybackRateChange={handlePlaybackRateChange}
        onVolumeChange={setVolume}
        onDownloadClick={canDownload ? handleDownloadClick : null}
        />
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  canDownload: PropTypes.bool,
  downloadFileName: PropTypes.string,
  extraCustomContent: PropTypes.node,
  mediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  onEndReached: PropTypes.func,
  onPartEndReached: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onPlayingPartIndexChange: PropTypes.func,
  onReady: PropTypes.func,
  onSeek: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired
  })),
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  screenOverlay: PropTypes.node,
  source: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  canDownload: false,
  downloadFileName: null,
  extraCustomContent: null,
  mediaPlayerRef: {
    current: null
  },
  onEndReached: () => {},
  onPartEndReached: () => {},
  onPlayStateChange: () => {},
  onPlayingPartIndexChange: () => {},
  onReady: () => {},
  onSeek: () => {},
  parts: [{ startPosition: 0 }],
  playbackRange: [0, 1],
  posterImageUrl: null,
  screenMode: MEDIA_SCREEN_MODE.video,
  screenOverlay: null,
  source: null
};

export default MediaPlayer;
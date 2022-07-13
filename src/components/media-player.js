import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useService } from './container-context.js';
import HttpClient from '../api-clients/http-client.js';
import MediaPlayerTrack from './media-player-track.js';
import MediaPlayerControls from './media-player-controls.js';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE } from '../domain/constants.js';

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

function MediaPlayer({
  source,
  startTimecode,
  stopTimecode,
  aspectRatio,
  screenMode,
  canDownload,
  downloadFileName,
  posterImageUrl,
  extraCustomContent,
  marks,
  onMarkReached,
  onEndReached,
  mediaPlayerRef
}) {
  const sourceType = getSourceType(source);

  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const httpClient = useService(HttpClient);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastReachedMark, setLastReachedMark] = useState(null);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);
  const [sourceUrl, setSourceUrl] = useState(sourceType === SOURCE_TYPE.eager ? source : null);
  const [lazyLoadCompletedAction, setLazyLoadCompletedAction] = useState(LAZY_LOAD_COMPLETED_ACTION.none);

  const progressIntervalInMilliseconds = 100;

  const isMarkReached = useCallback((mark, currentPlayedMilliseconds) => {
    const millisecondsBeforeOrAfterMark = Math.abs(mark.timecode - currentPlayedMilliseconds);
    return millisecondsBeforeOrAfterMark <= progressIntervalInMilliseconds;
  }, []);

  useEffect(() => {
    const reachedMark = marks.find(mark => isMarkReached(mark, playedMilliseconds));
    if (!isSeeking && reachedMark && reachedMark.key !== lastReachedMark?.key) {
      onMarkReached(reachedMark);
      setLastReachedMark(reachedMark);
    }
  }, [isSeeking, isMarkReached, marks, lastReachedMark, onMarkReached, playedMilliseconds]);

  const handleSeek = milliseconds => {
    trackRef.current.seekTo(milliseconds);
  };

  const handleToggleMute = () => {
    setIsMuted(oldValue => !oldValue);
  };

  const lazyLoadSource = async completedAction => {
    setLazyLoadCompletedAction(completedAction);
    setSourceUrl(await source());
  };

  const handleTogglePlay = async () => {
    if (!sourceUrl && sourceType === SOURCE_TYPE.lazy) {
      await lazyLoadSource(LAZY_LOAD_COMPLETED_ACTION.play);
    } else {
      trackRef.current.togglePlay();
    }
  };

  const handleEndReached = () => {
    if (!isSeeking) {
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

  const handleDownloadClick = async () => {
    if (!sourceUrl && sourceType === SOURCE_TYPE.lazy) {
      await lazyLoadSource(LAZY_LOAD_COMPLETED_ACTION.download);
    } else {
      httpClient.download(sourceUrl, downloadFileName);
    }
  };

  const handleDuration = duration => {
    setDurationInMilliseconds(duration);
    switch (lazyLoadCompletedAction) {
      case LAZY_LOAD_COMPLETED_ACTION.play:
        handleTogglePlay();
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
    togglePlay: trackRef.current?.togglePlay,
    seekTo: trackRef.current?.seekTo,
    seekToMark: mark => {
      trackRef.current.seekTo(mark.timecode);
      setLastReachedMark(mark);
    },
    reset: () => {
      trackRef.current.seekTo(0);
      setLastReachedMark(null);
    }
  };

  if (sourceType === SOURCE_TYPE.none) {
    return <div className="MediaPlayer" />;
  }

  return (
    <div className={classNames('MediaPlayer', { 'MediaPlayer--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
      {sourceUrl && (
        <MediaPlayerTrack
          trackRef={trackRef}
          volume={volume}
          isMuted={isMuted}
          sourceUrl={sourceUrl}
          aspectRatio={aspectRatio}
          screenMode={screenMode}
          startTimecode={startTimecode}
          stopTimecode={stopTimecode}
          playbackRate={playbackRate}
          progressIntervalInMilliseconds={progressIntervalInMilliseconds}
          onDuration={handleDuration}
          onEndReached={handleEndReached}
          onProgress={setPlayedMilliseconds}
          onPlayStateChange={setPlayState}
          posterImageUrl={posterImageUrl}
          loadImmediately={sourceType === SOURCE_TYPE.lazy}
          />
      )}
      {extraCustomContent && (<div>{extraCustomContent}</div>)}
      <MediaPlayerProgressBar
        marks={marks}
        onSeek={handleSeek}
        onSeekStart={handleSeekStart}
        onSeekEnd={handleSeekEnd}
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        />
      <MediaPlayerControls
        isMuted={isMuted}
        playState={playState}
        screenMode={screenMode}
        durationInMilliseconds={durationInMilliseconds}
        playedMilliseconds={playedMilliseconds}
        volume={volume}
        onSeek={handleSeek}
        onPlaybackRateChange={handlePlaybackRateChange}
        onToggleMute={handleToggleMute}
        onTogglePlay={handleTogglePlay}
        onVolumeChange={setVolume}
        extraCustomContent={extraCustomContent}
        marks={marks}
        onMarkReached={onMarkReached}
        onEndReached={onEndReached}
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
  marks: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    timecode: PropTypes.number.isRequired,
    text: PropTypes.string
  })),
  mediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  onEndReached: PropTypes.func,
  onMarkReached: PropTypes.func,
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  source: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  startTimecode: PropTypes.number,
  stopTimecode: PropTypes.number
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  canDownload: false,
  downloadFileName: null,
  extraCustomContent: null,
  marks: [],
  mediaPlayerRef: {
    current: null
  },
  onEndReached: () => {},
  onMarkReached: () => {},
  posterImageUrl: null,
  screenMode: MEDIA_SCREEN_MODE.video,
  source: null,
  startTimecode: null,
  stopTimecode: null
};

export default MediaPlayer;

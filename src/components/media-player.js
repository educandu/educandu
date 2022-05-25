import PropTypes from 'prop-types';
import classNames from 'classnames';
import MediaPlayerTrack from './media-player-track.js';
import MediaPlayerControls from './media-player-controls.js';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE } from '../domain/constants.js';

function MediaPlayer({
  sourceUrl,
  startTimecode,
  stopTimecode,
  aspectRatio,
  audioOnly,
  previewMode,
  canDownload,
  posterImageUrl,
  extraCustomContent,
  marks,
  onMarkReached,
  onEndReached,
  mediaPlayerRef
}) {
  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastReachedMark, setLastReachedMark] = useState(null);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);

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

  const handleTogglePlay = () => {
    trackRef.current.togglePlay();
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

  if (!sourceUrl) {
    return <div className="MediaPlayer" />;
  }

  return (
    <div className={classNames('MediaPlayer', { 'MediaPlayer--audioOnly': audioOnly })}>
      <MediaPlayerTrack
        trackRef={trackRef}
        volume={volume}
        isMuted={isMuted}
        sourceUrl={sourceUrl}
        audioOnly={audioOnly}
        previewMode={previewMode}
        aspectRatio={aspectRatio}
        startTimecode={startTimecode}
        stopTimecode={stopTimecode}
        playbackRate={playbackRate}
        progressIntervalInMilliseconds={progressIntervalInMilliseconds}
        onDuration={setDurationInMilliseconds}
        onEndReached={handleEndReached}
        onProgress={setPlayedMilliseconds}
        onPlayStateChange={setPlayState}
        posterImageUrl={posterImageUrl}
        />
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
        sourceUrl={sourceUrl}
        canDownload={canDownload}
        isMuted={isMuted}
        playState={playState}
        durationInMilliseconds={durationInMilliseconds}
        playedMilliseconds={playedMilliseconds}
        progressIntervalInMilliseconds={progressIntervalInMilliseconds}
        volume={volume}
        onSeek={handleSeek}
        onPlaybackRateChange={handlePlaybackRateChange}
        onToggleMute={handleToggleMute}
        onTogglePlay={handleTogglePlay}
        onVolumeChange={setVolume}
        audioOnly={audioOnly}
        extraCustomContent={extraCustomContent}
        marks={marks}
        onMarkReached={onMarkReached}
        onEndReached={onEndReached}
        />
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  canDownload: PropTypes.bool,
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
  previewMode: PropTypes.bool,
  sourceUrl: PropTypes.string,
  startTimecode: PropTypes.number,
  stopTimecode: PropTypes.number
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  canDownload: false,
  extraCustomContent: null,
  marks: [],
  mediaPlayerRef: {
    current: null
  },
  onEndReached: () => {},
  onMarkReached: () => {},
  posterImageUrl: null,
  previewMode: false,
  sourceUrl: null,
  startTimecode: null,
  stopTimecode: null
};

export default MediaPlayer;

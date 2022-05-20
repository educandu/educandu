import PropTypes from 'prop-types';
import MediaPlayerTrack from './media-player-track.js';
import MediaPlayerControls from './media-player-controls.js';
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
  extraContentTop,
  marks,
  onMarkReached,
  onEndReached,
  mediaPlayerRef
}) {
  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
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
    if (reachedMark && reachedMark.key !== lastReachedMark?.key) {
      onMarkReached(reachedMark);
      setLastReachedMark(reachedMark);
    }
  }, [playedMilliseconds, marks, lastReachedMark, isMarkReached, onMarkReached]);

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
    onEndReached();
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
    <div className="MediaPlayer">
      <MediaPlayerTrack
        trackRef={trackRef}
        marks={marks}
        volume={volume}
        isMuted={isMuted}
        sourceUrl={sourceUrl}
        audioOnly={audioOnly}
        previewMode={previewMode}
        aspectRatio={aspectRatio}
        startTimecode={startTimecode}
        stopTimecode={stopTimecode}
        progressIntervalInMilliseconds={progressIntervalInMilliseconds}
        onDuration={setDurationInMilliseconds}
        onEndReached={handleEndReached}
        onProgress={setPlayedMilliseconds}
        onPlayStateChange={setPlayState}
        posterImageUrl={posterImageUrl}
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
        onToggleMute={handleToggleMute}
        onTogglePlay={handleTogglePlay}
        onVolumeChange={setVolume}
        standalone={audioOnly}
        extraContentTop={extraContentTop}
        marks={marks}
        />
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  canDownload: PropTypes.bool,
  extraContentTop: PropTypes.node,
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
  extraContentTop: null,
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

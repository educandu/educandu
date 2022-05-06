import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import MediaPlayerTrack from './media-player-track.js';
import { ASPECT_RATIO, PLAY_STATE } from './media-player-constants.js';
import MediaPlayerControls from './media-player-controls.js';

function MediaPlayer({ sourceUrl, aspectRatio, audioOnly, posterImageUrl }) {
  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(PLAY_STATE.initializing);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);

  const handleSeek = milliseconds => {
    trackRef.current.seekTo(milliseconds);
  };

  const handleToggleMute = () => {
    setIsMuted(oldValue => !oldValue);
  };

  const handleTogglePlay = () => {
    trackRef.current.togglePlay();
  };

  if (!sourceUrl) {
    return <div className="MediaPlayer" />;
  }

  return (
    <div className="MediaPlayer">
      <MediaPlayerTrack
        trackRef={trackRef}
        volume={volume}
        isMuted={isMuted}
        sourceUrl={sourceUrl}
        audioOnly={audioOnly}
        aspectRatio={aspectRatio}
        onDuration={setDurationInMilliseconds}
        onProgress={setPlayedMilliseconds}
        onPlayStateChange={setPlayState}
        posterImageUrl={posterImageUrl}
        />
      <MediaPlayerControls
        isMuted={isMuted}
        playState={playState}
        durationInMilliseconds={durationInMilliseconds}
        playedMilliseconds={playedMilliseconds}
        volume={volume}
        onSeek={handleSeek}
        onToggleMute={handleToggleMute}
        onTogglePlay={handleTogglePlay}
        onVolumeChange={setVolume}
        standalone={audioOnly}
        />
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  sourceUrl: PropTypes.string
};

MediaPlayer.defaultProps = {
  aspectRatio: ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  posterImageUrl: null,
  sourceUrl: null
};

export default MediaPlayer;

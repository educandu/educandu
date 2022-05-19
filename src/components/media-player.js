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
  pauseCue,
  previewMode,
  posterImageUrl,
  extraContentTop,
  marks,
  onMarkReached
}) {
  const trackRef = useRef();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [reachedMarks, setReachedMarks] = useState([]);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const progressIntervalInMilliseconds = 100;
  const marksTimecodes = Object.keys(marks).map(Number);

  const isMarkReached = useCallback((markTimecode, currentPlayedMilliseconds) => {
    const millisecondsBeforeOrAfterMark = Math.abs(markTimecode - currentPlayedMilliseconds);
    if (millisecondsBeforeOrAfterMark <= progressIntervalInMilliseconds && !reachedMarks.includes(markTimecode)) {
      setReachedMarks([...reachedMarks, markTimecode]);
      return true;
    }
    return false;
  }, [reachedMarks]);

  useEffect(() => {
    const reachedMarkTimecode = marksTimecodes.find(markTimecode => isMarkReached(markTimecode, playedMilliseconds));
    if (reachedMarkTimecode) {
      onMarkReached(reachedMarkTimecode);
    }
  }, [marksTimecodes, playedMilliseconds, isMarkReached, onMarkReached]);

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
        marks={marks}
        volume={volume}
        isMuted={isMuted}
        sourceUrl={sourceUrl}
        audioOnly={audioOnly}
        previewMode={previewMode}
        aspectRatio={aspectRatio}
        startTimecode={startTimecode}
        stopTimecode={stopTimecode}
        pauseCue={pauseCue}
        progressIntervalInMilliseconds={progressIntervalInMilliseconds}
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
  extraContentTop: PropTypes.node,
  marks: PropTypes.object,
  onMarkReached: PropTypes.func,
  pauseCue: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  previewMode: PropTypes.bool,
  sourceUrl: PropTypes.string,
  startTimecode: PropTypes.number,
  stopTimecode: PropTypes.number
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  extraContentTop: null,
  marks: {},
  onMarkReached: () => {},
  pauseCue: null,
  posterImageUrl: null,
  previewMode: false,
  sourceUrl: null,
  startTimecode: null,
  stopTimecode: null
};

export default MediaPlayer;

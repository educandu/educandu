import PropTypes from 'prop-types';
import classNames from 'classnames';
import MediaPlayback from './media-playback.js';
import React, { useRef, useState } from 'react';
import { useService } from '../../container-context.js';
import HttpClient from '../../../api-clients/http-client.js';
import MediaPlayerControls from '../media-player-controls.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import MediaPlayerProgressBar from '../media-player-progress-bar.js';
import { isInternalSourceType } from '../../../utils/source-utils.js';
import {
  MEDIA_PLAY_STATE,
  MEDIA_SCREEN_MODE,
  MEDIA_ASPECT_RATIO,
} from '../../../domain/constants.js';

function MediaPlayer({
  sourceUrl,
  screenMode,
  aspectRatio,
  canDownload,
  downloadFileName,
  posterImageUrl,
  mediaPlayerRef
}) {
  const mediaPlaybackRef = useRef();
  const [volume, setVolume] = useState(1);
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const handleDuration = newDurationInMilliseconds => {
    setDurationInMilliseconds(newDurationInMilliseconds);
  };

  const handleProgress = progressInMilliseconds => {
    setPlayedMilliseconds(progressInMilliseconds);
  };

  const handlePlayClick = async () => {
    mediaPlaybackRef.current.play();
  };

  const handlePlaying = () => {
    setPlayState(MEDIA_PLAY_STATE.playing);
  };

  const handlePauseClick = () => {
    mediaPlaybackRef.current.pause();
    setPlayState(MEDIA_PLAY_STATE.pausing);
  };

  const handlePausing = () => {
    setPlayState(MEDIA_PLAY_STATE.pausing);
  };

  const handleEnded= () => {
    setPlayState(MEDIA_PLAY_STATE.stopped);
  };

  const handleSeek = milliseconds => {
    mediaPlaybackRef.current.seekToTimecode(milliseconds);
  };

  const handleBuffering = () => {
    setPlayState(MEDIA_PLAY_STATE.buffering);
  };

  const handlePlaybackRateChange = newRate => {
    setPlaybackRate(newRate);
  };

  const handleDownloadClick = async () => {
    const withCredentials = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    httpClient.download(sourceUrl, downloadFileName, withCredentials);
  };

  mediaPlayerRef.current = {
    play: mediaPlaybackRef.current?.play,
    pause: mediaPlaybackRef.current?.pause
  };

  return (
    <div className={classNames('MediaPlayer', { 'MediaPlayer--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
      <MediaPlayback
        volume={volume}
        sourceUrl={sourceUrl}
        aspectRatio={aspectRatio}
        playbackRate={playbackRate}
        posterImageUrl={posterImageUrl}
        mediaPlaybackRef={mediaPlaybackRef}
        audioOnly={screenMode !== MEDIA_SCREEN_MODE.video}
        onPlay={handlePlaying}
        onPause={handlePausing}
        onEnded={handleEnded}
        onDuration={handleDuration}
        onProgress={handleProgress}
        onBuffering={handleBuffering}
        />
      <MediaPlayerProgressBar
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        onSeek={handleSeek}
        />
      <MediaPlayerControls
        volume={volume}
        playState={playState}
        screenMode={screenMode}
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        onVolumeChange={setVolume}
        onPlayClick={handlePlayClick}
        onPauseClick={handlePauseClick}
        onPlaybackRateChange={handlePlaybackRateChange}
        onDownloadClick={canDownload ? handleDownloadClick : null}
        />
    </div>
  );
}

MediaPlayer.propTypes = {
  sourceUrl: PropTypes.string.isRequired,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  downloadFileName: PropTypes.string,
  canDownload: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  mediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  screenMode: MEDIA_SCREEN_MODE.video,
  canDownload: false,
  downloadFileName: null,
  posterImageUrl: null,
  mediaPlayerRef: {
    current: null
  }
};

export default MediaPlayer;

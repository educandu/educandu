import PropTypes from 'prop-types';
import classNames from 'classnames';
import Html5Player from './html5-player.js';
import YoutubePlayer from './youtube-player.js';
import { useService } from '../../container-context.js';
import AudioIcon from '../../icons/general/audio-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import HttpClient from '../../../api-clients/http-client.js';
import MediaPlayerControls from '../media-player-controls.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import MediaPlayerProgressBar from '../media-player-progress-bar.js';
import { isInternalSourceType, isYoutubeSourceType } from '../../../utils/source-utils.js';
import {
  MEDIA_PLAY_STATE,
  MEDIA_SCREEN_MODE,
  MEDIA_ASPECT_RATIO,
  MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS
} from '../../../domain/constants.js';

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
  sourceUrl,
  playbackRange,
  parts,
  aspectRatio,
  screenMode,
  screenWidth,
  canDownload,
  downloadFileName,
  posterImageUrl,
  mediaPlayerRef,
  customScreenOverlay,
  customUnderScreenContent,
  onReady,
  onSeek,
  onProgress,
  onPartEndReached,
  onPlayingPartIndexChange
}) {
  const player = useRef();
  const [volume, setVolume] = useState(1);
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const [isSeeking, setIsSeeking] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const [lastPlayedPartIndex, setLastPlayedPartIndex] = useState(-1);
  const [lastReachedPartEndIndex, setLastReachedPartEndIndex] = useState(-1);

  const handleDuration = newDurationInMilliseconds => {
    setDurationInMilliseconds(newDurationInMilliseconds);
  };

  const handleProgress = progressInMilliseconds => {
    setPlayedMilliseconds(progressInMilliseconds);
    onProgress(progressInMilliseconds);
  };

  const handlePlayClick = () => {
    player.current.play();
  };

  const handlePlaying = () => {
    setPlayState(MEDIA_PLAY_STATE.playing);
  };

  const handlePauseClick = () => {
    player.current.pause();
    setPlayState(MEDIA_PLAY_STATE.pausing);
  };

  const handlePausing = () => {
    setPlayState(MEDIA_PLAY_STATE.pausing);
  };

  const handleEnded = () => {
    if (!isSeeking) {
      setLastReachedPartEndIndex(-1);
      onPartEndReached(parts.length - 1);
      setPlayState(MEDIA_PLAY_STATE.stopped);
    }
  };

  const handleSeek = milliseconds => {
    setLastReachedPartEndIndex(-1);
    player.current.seekToTimecode(milliseconds);
    onSeek();
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
  };

  const handleBuffering = () => {
    setPlayState(MEDIA_PLAY_STATE.buffering);
  };

  const handlePlaybackRateChange = newRate => {
    setPlaybackRate(newRate);
  };

  const handleDownloadClick = () => {
    const withCredentials = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    httpClient.download(sourceUrl, downloadFileName, withCredentials);
  };

  const triggerSeekToPart = partIndex => {
    setLastReachedPartEndIndex(partIndex - 1);
    const partStartTimecode = (parts[partIndex]?.startPosition || 0) * durationInMilliseconds;
    player.current.seekToTimecode(partStartTimecode);
    setPlayedMilliseconds(partStartTimecode);
    onSeek();
  };

  const triggerReset = () => {
    setLastReachedPartEndIndex(-1);
    player.current?.stop();
    player.current?.seekToTimecode(0);
    setPlayedMilliseconds(0);
  };

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
      setLastReachedPartEndIndex(currentPartIndex);
      onPartEndReached(currentPartIndex);
    }
  }, [isSeeking, parts, durationInMilliseconds, playedMilliseconds, lastPlayedPartIndex, lastReachedPartEndIndex, onPlayingPartIndexChange, onPartEndReached]);

  mediaPlayerRef.current = {
    play: player.current?.play,
    pause: player.current?.pause,
    stop: player.current?.stop,
    seekToPart: triggerSeekToPart,
    reset: triggerReset
  };

  const Player = isYoutubeSourceType(sourceUrl) ? YoutubePlayer : Html5Player;
  const noScreen = screenMode === MEDIA_SCREEN_MODE.none;

  const playerClasses = classNames(
    'MediaPlayer-player',
    `u-width-${screenWidth}`,
    { 'MediaPlayer-player--noScreen': noScreen },
    { 'MediaPlayer-player--sixteenToNine': aspectRatio === MEDIA_ASPECT_RATIO.sixteenToNine },
    { 'MediaPlayer-player--fourToThree': aspectRatio === MEDIA_ASPECT_RATIO.fourToThree }
  );

  return (
    <div className={classNames('MediaPlayer', { 'MediaPlayer--noScreen': noScreen })}>
      <div className={playerClasses}>
        <Player
          volume={volume}
          sourceUrl={sourceUrl}
          aspectRatio={aspectRatio}
          playbackRate={playbackRate}
          playbackRange={playbackRange}
          posterImageUrl={posterImageUrl}
          playerRef={player}
          audioOnly={noScreen}
          onReady={onReady}
          onPlay={handlePlaying}
          onPause={handlePausing}
          onEnded={handleEnded}
          onDuration={handleDuration}
          onProgress={handleProgress}
          onBuffering={handleBuffering}
          />
        {screenMode === MEDIA_SCREEN_MODE.audio && (
          <div className="MediaPlayer-playerAudioScreenOverlay">
            <AudioIcon />
          </div>
        )}
        {!!customScreenOverlay && (
          <div className="MediaPlayer-playerCustomScreenOverlay">
            {customScreenOverlay}
          </div>
        )}
      </div>
      {customUnderScreenContent}
      <MediaPlayerProgressBar
        playedMilliseconds={playedMilliseconds}
        durationInMilliseconds={durationInMilliseconds}
        onSeek={handleSeek}
        onSeekStart={handleSeekStart}
        onSeekEnd={handleSeekEnd}
        parts={parts}
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
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired
  })),
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  screenWidth: PropTypes.oneOf([...Array(101).keys()]),
  downloadFileName: PropTypes.string,
  canDownload: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  mediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  customScreenOverlay: PropTypes.node,
  customUnderScreenContent: PropTypes.node,
  onReady: PropTypes.func,
  onSeek: PropTypes.func,
  onProgress: PropTypes.func,
  onPartEndReached: PropTypes.func,
  onPlayingPartIndexChange: PropTypes.func
};

MediaPlayer.defaultProps = {
  playbackRange: [0, 1],
  parts: [],
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  screenMode: MEDIA_SCREEN_MODE.video,
  screenWidth: 100,
  canDownload: false,
  downloadFileName: null,
  posterImageUrl: null,
  mediaPlayerRef: {
    current: null
  },
  customScreenOverlay: null,
  customUnderScreenContent: null,
  onReady: () => {},
  onSeek: () => {},
  onProgress: () => {},
  onPartEndReached: () => {},
  onPlayingPartIndexChange: () => {}
};

export default MediaPlayer;

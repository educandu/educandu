import PropTypes from 'prop-types';
import classNames from 'classnames';
import Html5Player from './html5-player.js';
import YoutubePlayer from './youtube-player.js';
import { useService } from '../container-context.js';
import AudioIcon from '../icons/general/audio-icon.js';
import HttpClient from '../../api-clients/http-client.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import MediaPlayerControls from './media-player-controls.js';
import { remountOnPropChanges } from '../../ui/react-helper.js';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import { isInternalSourceType, isYoutubeSourceType } from '../../utils/source-utils.js';
import { MEDIA_SCREEN_MODE, MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

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
  aspectRatio,
  canDownload,
  customScreenOverlay,
  customUnderScreenContent,
  downloadFileName,
  mediaPlayerRef,
  parts,
  playbackRange,
  playbackRate,
  posterImageUrl,
  preload,
  renderControls,
  renderProgressBar,
  screenMode,
  screenWidth,
  sourceUrl,
  volume,
  onDuration,
  onEnded,
  onPartEndReached,
  onPause,
  onPlay,
  onPlayingPartIndexChange,
  onProgress,
  onReady,
  onSeek,
  onSeekEnd,
  onSeekStart
}) {
  const playerRef = useRef();
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalVolume, setInternalVolume] = useState(1);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [internalPlaybackRate, setInternaPlaybackRate] = useState(1);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);

  const [lastPlayedPartIndex, setLastPlayedPartIndex] = useState(-1);
  const [lastReachedPartEndIndex, setLastReachedPartEndIndex] = useState(-1);

  const appliedVolume = volume ?? internalVolume;
  const appliedPlaybackRate = playbackRate ?? internalPlaybackRate;

  const handleDuration = newDurationInMilliseconds => {
    setDurationInMilliseconds(newDurationInMilliseconds);
    onDuration(newDurationInMilliseconds);
  };

  const handleProgress = progressInMilliseconds => {
    setPlayedMilliseconds(progressInMilliseconds);
    onProgress(progressInMilliseconds);
  };

  const handlePlayClick = () => {
    playerRef.current.play();
  };

  const handlePlaying = () => {
    onPlay();
    setIsPlaying(true);
  };

  const handlePauseClick = () => {
    playerRef.current.pause();
    setIsPlaying(false);
  };

  const handlePausing = () => {
    onPause();
    setIsPlaying(false);
  };

  const handleEnded = () => {
    if (!isSeeking) {
      onEnded();
      setLastReachedPartEndIndex(-1);
      onPartEndReached(parts.length - 1);
    }
    setIsPlaying(false);
  };

  const handleSeek = milliseconds => {
    setLastReachedPartEndIndex(-1);
    playerRef.current.seekToTimecode(milliseconds);
    onSeek();
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    onSeekStart();
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    onSeekEnd();
  };

  const handleDownloadClick = () => {
    const withCredentials = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    httpClient.download(sourceUrl, downloadFileName, withCredentials);
  };

  const triggerSeekToTimecode = timecodeInMilliseconds => {
    const newPlayedMilliseconds = Math.min(timecodeInMilliseconds, durationInMilliseconds);
    playerRef.current.seekToTimecode(newPlayedMilliseconds);
    setPlayedMilliseconds(newPlayedMilliseconds);
    onSeek();
  };

  const triggerSeekToPart = partIndex => {
    setLastReachedPartEndIndex(partIndex - 1);
    const partStartTimecode = (parts[partIndex]?.startPosition || 0) * durationInMilliseconds;
    triggerSeekToTimecode(partStartTimecode);
  };

  const triggerReset = () => {
    setLastReachedPartEndIndex(-1);
    playerRef.current?.reset();
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

  mediaPlayerRef.current = playerRef.current
    ? {
      play: playerRef.current.play,
      pause: playerRef.current.pause,
      stop: playerRef.current.stop,
      reset: triggerReset,
      seekToTimecode: triggerSeekToTimecode,
      seekToPart: triggerSeekToPart
    }
    : null;

  const Player = isYoutubeSourceType(sourceUrl) ? YoutubePlayer : Html5Player;
  const noScreen = screenMode === MEDIA_SCREEN_MODE.none;

  const mainClasses = classNames(
    'MediaPlayer',
    { 'MediaPlayer--noScreen': noScreen },
    { 'MediaPlayer--hidden': noScreen && !!renderControls && !!renderProgressBar }
  );

  const playerClasses = classNames(
    'MediaPlayer-player',
    `u-width-${screenWidth}`,
    { 'MediaPlayer-player--noScreen': noScreen },
    { 'MediaPlayer-player--hidden': noScreen && !!renderControls && !!renderProgressBar },
    { 'MediaPlayer-player--sixteenToNine': aspectRatio === MEDIA_ASPECT_RATIO.sixteenToNine },
    { 'MediaPlayer-player--fourToThree': aspectRatio === MEDIA_ASPECT_RATIO.fourToThree }
  );

  return (
    <div className={mainClasses}>
      <div className={playerClasses}>
        <Player
          aspectRatio={aspectRatio}
          audioOnly={noScreen}
          playbackRange={playbackRange}
          playbackRate={appliedPlaybackRate}
          playerRef={playerRef}
          preload={preload}
          posterImageUrl={posterImageUrl}
          sourceUrl={sourceUrl}
          volume={appliedVolume}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onPause={handlePausing}
          onPlay={handlePlaying}
          onProgress={handleProgress}
          onReady={onReady}
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
      {!!renderProgressBar && renderProgressBar()}
      {!renderProgressBar && (
        <MediaPlayerProgressBar
          durationInMilliseconds={durationInMilliseconds}
          parts={parts}
          playedMilliseconds={playedMilliseconds}
          onSeek={handleSeek}
          onSeekEnd={handleSeekEnd}
          onSeekStart={handleSeekStart}
          />
      )}

      {!!renderControls && renderControls()}
      {!renderControls && (
        <MediaPlayerControls
          durationInMilliseconds={durationInMilliseconds}
          isPlaying={isPlaying}
          playedMilliseconds={playedMilliseconds}
          screenMode={screenMode}
          volume={appliedVolume}
          onDownloadClick={canDownload ? handleDownloadClick : null}
          onPauseClick={handlePauseClick}
          onPlaybackRateChange={setInternaPlaybackRate}
          onPlayClick={handlePlayClick}
          onVolumeChange={setInternalVolume}
          />
      )}
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  canDownload: PropTypes.bool,
  customScreenOverlay: PropTypes.node,
  customUnderScreenContent: PropTypes.node,
  downloadFileName: PropTypes.string,
  mediaPlayerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired
  })),
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  preload: PropTypes.bool,
  renderControls: PropTypes.func,
  renderProgressBar: PropTypes.func,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  screenWidth: PropTypes.oneOf([...Array(101).keys()]),
  sourceUrl: PropTypes.string.isRequired,
  volume: PropTypes.number,
  onDuration: PropTypes.func,
  onEnded: PropTypes.func,
  onPartEndReached: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onPlayingPartIndexChange: PropTypes.func,
  onProgress: PropTypes.func,
  onReady: PropTypes.func,
  onSeek: PropTypes.func,
  onSeekEnd: PropTypes.func,
  onSeekStart: PropTypes.func
};

MediaPlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  canDownload: false,
  customScreenOverlay: null,
  customUnderScreenContent: null,
  downloadFileName: null,
  mediaPlayerRef: {
    current: null
  },
  parts: [],
  playbackRange: [0, 1],
  playbackRate: null,
  posterImageUrl: null,
  preload: false,
  renderControls: null,
  renderProgressBar: null,
  screenMode: MEDIA_SCREEN_MODE.video,
  screenWidth: 100,
  volume: null,
  onDuration: () => {},
  onEnded: () => {},
  onPartEndReached: () => {},
  onPause: () => {},
  onPlay: () => {},
  onPlayingPartIndexChange: () => {},
  onProgress: () => {},
  onReady: () => {},
  onSeek: () => {},
  onSeekEnd: () => {},
  onSeekStart: () => {}
};

export default remountOnPropChanges(MediaPlayer, ({ sourceUrl, playbackRange = [0, 1] }) => {
  return [sourceUrl, ...playbackRange].join('|');
});

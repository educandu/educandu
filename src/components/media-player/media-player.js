import PropTypes from 'prop-types';
import classNames from 'classnames';
import Html5Player from './html5-player.js';
import YoutubePlayer from './youtube-player.js';
import { useService } from '../container-context.js';
import AudioIcon from '../icons/general/audio-icon.js';
import HttpClient from '../../api-clients/http-client.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { remountOnPropChanges } from '../../ui/react-helper.js';
import { useIsFullscreenSupported } from '../request-context.js';
import React, { useEffect, useId, useRef, useState } from 'react';
import MediaPlayerProgressBar from './media-player-progress-bar.js';
import { useResolvedMediaLibraryItemForSource } from './media-hooks.js';
import { isInternalSourceType, isYoutubeSourceType } from '../../utils/source-utils.js';
import MediaPlayerControls, { MEDIA_PLAYER_CONTROLS_STATE } from './media-player-controls.js';
import { MEDIA_SCREEN_MODE, MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS, DEFAULT_MEDIA_PLAYBACK_RATE } from '../../domain/constants.js';

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
  allowDownload,
  allowFullscreen,
  allowLoop,
  allowPartClick,
  allowMediaInfo,
  allowPlaybackRate,
  aspectRatio,
  clickToPlay,
  customScreenOverlay,
  customUnderControlsContent,
  customUnderScreenContent,
  downloadFileName,
  initialVolume,
  mediaPlayerRef,
  millisecondsLength,
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
  onEnterFullscreen,
  onExitFullscreen,
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
  const mediaPlayerInstanceId = useId();
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const isFullscreenSupported = useIsFullscreenSupported();

  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMedia, setLoopMedia] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [internalVolume, setInternalVolume] = useState(initialVolume);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [internalPlaybackRate, setInternaPlaybackRate] = useState(DEFAULT_MEDIA_PLAYBACK_RATE);

  const [lastPlayedPartIndex, setLastPlayedPartIndex] = useState(-1);
  const [lastReachedPartEndIndex, setLastReachedPartEndIndex] = useState(-1);

  const resolvedMediaLibraryItem = useResolvedMediaLibraryItemForSource(sourceUrl);

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
    if (!isSeeking && loopMedia) {
      playerRef.current.play();
    }
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

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    onEnterFullscreen();
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    onExitFullscreen();
  };

  const handleFullscreenChange = newIsFullscreen => {
    if (newIsFullscreen) {
      playerRef.current?.fullscreen?.enter();
    } else {
      playerRef.current?.fullscreen?.exit();
    }
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
      fullscreen: playerRef.current.fullscreen,
      reset: triggerReset,
      seekToTimecode: triggerSeekToTimecode,
      seekToPart: triggerSeekToPart
    }
    : null;

  const Player = isYoutubeSourceType(sourceUrl) ? YoutubePlayer : Html5Player;
  const noScreen = screenMode === MEDIA_SCREEN_MODE.none;
  const canEnterFullscreen = isFullscreenSupported && allowFullscreen && screenMode !== MEDIA_SCREEN_MODE.none;

  const mainClasses = classNames(
    'MediaPlayer',
    { 'MediaPlayer--noScreen': noScreen },
    { 'MediaPlayer--hidden': noScreen && !!renderControls && !!renderProgressBar },
    { 'is-fullscreen': !!isFullscreen }
  );

  const playerClasses = classNames(
    'MediaPlayer-player',
    `u-width-${screenWidth}`,
    { 'MediaPlayer-player--noScreen': noScreen },
    { 'MediaPlayer-player--hidden': noScreen && !!renderControls && !!renderProgressBar },
    { 'MediaPlayer-player--sixteenToNine': aspectRatio === MEDIA_ASPECT_RATIO.sixteenToNine },
    { 'MediaPlayer-player--fourToThree': aspectRatio === MEDIA_ASPECT_RATIO.fourToThree }
  );

  const underPlayerContentClasses = classNames(
    'MediaPlayer-underPlayerContent',
    { 'is-fullscreen': !!isFullscreen }
  );

  return (
    <div className={mainClasses} id={mediaPlayerInstanceId} key={`${mediaPlayerInstanceId}_${screenMode}`}>
      <div className={playerClasses}>
        <Player
          aspectRatio={aspectRatio}
          audioOnly={noScreen}
          clickToPlay={clickToPlay}
          fullscreenContainerId={canEnterFullscreen ? mediaPlayerInstanceId : null}
          playbackRange={playbackRange}
          playbackRate={appliedPlaybackRate}
          playerRef={playerRef}
          preload={preload}
          posterImageUrl={posterImageUrl}
          sourceUrl={sourceUrl}
          volume={appliedVolume}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onEnterFullscreen={handleEnterFullscreen}
          onExitFullscreen={handleExitFullscreen}
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

      <div className={underPlayerContentClasses}>
        {customUnderScreenContent}
        {!!renderProgressBar && renderProgressBar()}
        {!renderProgressBar && (
          <MediaPlayerProgressBar
            allowPartClick={allowPartClick}
            durationInMilliseconds={durationInMilliseconds}
            millisecondsLength={millisecondsLength}
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
            allowDownload={allowDownload}
            allowLoop={allowLoop}
            allowMediaInfo={!!allowMediaInfo && resolvedMediaLibraryItem.canResolve}
            allowFullscreen={canEnterFullscreen}
            allowPlaybackRate={allowPlaybackRate}
            durationInMilliseconds={durationInMilliseconds}
            millisecondsLength={millisecondsLength}
            playedMilliseconds={playedMilliseconds}
            screenMode={screenMode}
            state={isPlaying ? MEDIA_PLAYER_CONTROLS_STATE.playing : MEDIA_PLAYER_CONTROLS_STATE.paused}
            volume={appliedVolume}
            loopMedia={loopMedia}
            isFullscreen={isFullscreen}
            playbackRate={internalPlaybackRate}
            mediaInfo={resolvedMediaLibraryItem.resolvedItem}
            onDownloadClick={allowDownload ? handleDownloadClick : null}
            onPauseClick={handlePauseClick}
            onPlaybackRateChange={setInternaPlaybackRate}
            onLoopMediaChange={allowLoop ? setLoopMedia : null}
            onFullscreenChange={canEnterFullscreen ? handleFullscreenChange : null}
            onPlayClick={handlePlayClick}
            onVolumeChange={setInternalVolume}
            />
        )}
        {customUnderControlsContent}
      </div>
    </div>
  );
}

MediaPlayer.propTypes = {
  allowDownload: PropTypes.bool,
  allowFullscreen: PropTypes.bool,
  allowLoop: PropTypes.bool,
  allowPartClick: PropTypes.bool,
  allowMediaInfo: PropTypes.bool,
  allowPlaybackRate: PropTypes.bool,
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  clickToPlay: PropTypes.bool,
  customScreenOverlay: PropTypes.node,
  customUnderScreenContent: PropTypes.node,
  customUnderControlsContent: PropTypes.node,
  downloadFileName: PropTypes.string,
  initialVolume: PropTypes.number,
  millisecondsLength: PropTypes.number,
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
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
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
  allowDownload: false,
  allowFullscreen: false,
  allowLoop: false,
  allowPartClick: false,
  allowMediaInfo: false,
  allowPlaybackRate: false,
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  clickToPlay: true,
  customScreenOverlay: null,
  customUnderControlsContent: null,
  customUnderScreenContent: null,
  downloadFileName: null,
  initialVolume: 1,
  millisecondsLength: 0,
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
  onEnterFullscreen: () => {},
  onExitFullscreen: () => {},
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

export default remountOnPropChanges(MediaPlayer, ({ sourceUrl, playbackRange = [0, 1], aspectRatio }) => {
  return [sourceUrl, ...playbackRange, aspectRatio].join('|');
});

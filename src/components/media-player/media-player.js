import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import MultitrackMediaPlayer from './multitrack-media-player.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE } from '../../domain/constants.js';

const resolvedSourceToMultitrackSource = (sourceUrl, playbackRange) => ({
  mainTrack: {
    name: '',
    sourceUrl,
    volume: 1,
    playbackRange
  },
  secondaryTracks: []
});

const unresolvedSourceToMultitrackSource = (source, playbackRange) => {
  return {
    value: typeof source === 'function'
      ? () => source().then(sourceUrl => resolvedSourceToMultitrackSource(sourceUrl, playbackRange))
      : resolvedSourceToMultitrackSource(source, playbackRange)
  };
};

function MediaPlayer({
  source,
  playbackRange,
  aspectRatio,
  screenMode,
  screenWidth,
  screenOverlay,
  canDownload,
  downloadFileName,
  posterImageUrl,
  extraCustomContent,
  onPartEndReached,
  onProgress,
  onEndReached,
  onPlayStateChange,
  onPlayingPartIndexChange,
  onReady,
  onSeek,
  parts,
  mediaPlayerRef
}) {
  const [multitrackSources, setMultitrackSources] = useState(unresolvedSourceToMultitrackSource(source, playbackRange));

  useEffect(() => {
    const newSources = unresolvedSourceToMultitrackSource(source, playbackRange);
    setMultitrackSources(newSources);
  }, [source, playbackRange, setMultitrackSources]);

  return (
    <MultitrackMediaPlayer
      sources={multitrackSources.value}
      aspectRatio={aspectRatio}
      screenMode={screenMode}
      screenWidth={screenWidth}
      screenOverlay={screenOverlay}
      canDownload={canDownload}
      downloadFileName={downloadFileName}
      posterImageUrl={posterImageUrl}
      extraCustomContent={extraCustomContent}
      onPartEndReached={onPartEndReached}
      onProgress={onProgress}
      onEndReached={onEndReached}
      onPlayStateChange={onPlayStateChange}
      onPlayingPartIndexChange={onPlayingPartIndexChange}
      onReady={onReady}
      onSeek={onSeek}
      parts={parts}
      mediaPlayerRef={mediaPlayerRef}
      />
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
  onProgress: PropTypes.func,
  onReady: PropTypes.func,
  onSeek: PropTypes.func,
  parts: PropTypes.arrayOf(PropTypes.shape({
    startPosition: PropTypes.number.isRequired
  })),
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  screenOverlay: PropTypes.node,
  screenWidth: PropTypes.number,
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
  onProgress: () => {},
  onReady: () => {},
  onSeek: () => {},
  parts: [{ startPosition: 0 }],
  playbackRange: [0, 1],
  posterImageUrl: null,
  screenMode: MEDIA_SCREEN_MODE.video,
  screenOverlay: null,
  screenWidth: 100,
  source: null
};

export default MediaPlayer;

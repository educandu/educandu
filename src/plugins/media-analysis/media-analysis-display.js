import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import React, { Fragment, useMemo, useRef, useState } from 'react';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MediaAnalysisDisplay({ content }) {
  const playerRef = useRef(null);
  const { t } = useTranslation('mediaAnalysis');
  const clientConfig = useService(ClientConfig);
  const [playState, setPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const [areTextsExpanded, setAreTextsExpanded] = useState(false);
  const [selectedVolumePresetIndex, setSelectedVolumePresetIndex] = useState(0);

  const { width, mainTrack, secondaryTracks, chapters, volumePresets } = content;

  const sources = useMemo(() => {
    return {
      mainTrack: {
        name: mainTrack.name,
        sourceUrl: getAccessibleUrl({
          url: mainTrack.sourceUrl,
          cdnRootUrl: clientConfig.cdnRootUrl
        }),
        volume: volumePresets[selectedVolumePresetIndex].mainTrack,
        playbackRange: mainTrack.playbackRange
      },
      secondaryTracks: secondaryTracks.map((track, index) => ({
        name: track.name,
        sourceUrl: getAccessibleUrl({
          url: track.sourceUrl,
          cdnRootUrl: clientConfig.cdnRootUrl
        }),
        volume: volumePresets[selectedVolumePresetIndex].secondaryTracks[index]
      }))
    };
  }, [mainTrack, secondaryTracks, volumePresets, clientConfig, selectedVolumePresetIndex]);

  const canRenderMediaPlayer = sources.mainTrack.sourceUrl && sources.secondaryTracks.every(track => track.sourceUrl);

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)]
    .filter(text => !!text).join('\n\n');

  const handlePlayStateChange = newPlayState => {
    setPlayState(newPlayState);
  };

  const handleSelectedVolumePresetChange = volumePresetIndex => {
    setSelectedVolumePresetIndex(volumePresetIndex);
  };

  const handleChaptersTextsToggleClick = () => {
    setAreTextsExpanded(prevValue => !prevValue);
  };

  const handleChapterClick = chapterIndex => {
    if (playState === MEDIA_PLAY_STATE.playing) {
      playerRef.current.seekToPart(chapterIndex);
    } else {
      playerRef.current.play();
      setTimeout(() => playerRef.current.seekToPart(chapterIndex), 0);
    }
  };

  const determineChapterWidthInPercentage = chapterIndex => {
    const startPosition = chapters[chapterIndex]?.startPosition || 0;
    const nextStartPosition = chapters[chapterIndex + 1]?.startPosition || 1;
    return (nextStartPosition - startPosition) * 100;
  };

  const renderChapterTitle = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);
    const title = (
      <div
        key={chapter.key}
        className={classNames({
          'MediaAnalysisDisplay-chapterTitle': true,
          'MediaAnalysisDisplay-chapterTitle--interactive': canRenderMediaPlayer
        })}
        style={{
          width: `${widthInPercentage}%`,
          backgroundColor: `${chapter.color}`,
          color: `${getContrastColor(chapter.color)}`
        }}
        onClick={canRenderMediaPlayer ? () => handleChapterClick(index) : null}
        >
        {chapter.title}
      </div>
    );
    return canRenderMediaPlayer
      ? <Tooltip key={chapter.key} title={t('startPlaybackFromHere')}>{title}</Tooltip>
      : title;
  };

  const renderChapterText = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);
    return (
      <div
        key={chapter.key}
        style={{ width: `${widthInPercentage}%` }}
        className={classNames('MediaAnalysisDisplay-chapterText', { 'is-expanded': areTextsExpanded })}
        >
        <Markdown>{chapter.text}</Markdown>
      </div>
    );
  };

  const renderChapters = () => {
    const chapterTextsAreSet = chapters.some(chapter => chapter.text);
    return (
      <div className="MediaAnalysisDisplay-chapters">
        <div className="MediaAnalysisDisplay-chapterTitles">
          {chapters.map(renderChapterTitle)}
        </div>
        {!!chapterTextsAreSet && (
          <Fragment>
            <div className={classNames('MediaAnalysisDisplay-chapterTexts', { 'is-expanded': areTextsExpanded })}>
              {chapters.map(renderChapterText)}
            </div>
            <a onClick={handleChaptersTextsToggleClick} className="MediaAnalysisDisplay-chaptersTextsToggle">
              {areTextsExpanded ? t('common:less') : t('common:more')}
            </a>
          </Fragment>
        )}
      </div>
    );
  };

  return (
    <div className="MediaAnalysisDisplay">
      <div className={`MediaAnalysisDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayer && (
          <Fragment>
            <MultitrackMediaPlayer
              parts={chapters}
              sources={sources}
              aspectRatio={mainTrack.aspectRatio}
              screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              mediaPlayerRef={playerRef}
              showTrackMixer={secondaryTracks.length > 0}
              extraCustomContent={renderChapters()}
              onPlayStateChange={handlePlayStateChange}
              selectedVolumePreset={selectedVolumePresetIndex}
              onSelectedVolumePresetChange={handleSelectedVolumePresetChange}
              volumePresetOptions={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
              />
            <CopyrightNotice value={combinedCopyrightNotice} />
          </Fragment>
        )}
        {!canRenderMediaPlayer && renderChapters()}
      </div>
    </div>
  );
}

MediaAnalysisDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MediaAnalysisDisplay;

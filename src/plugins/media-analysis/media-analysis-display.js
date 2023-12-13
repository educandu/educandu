import { Tooltip } from 'antd';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

function MediaAnalysisDisplay({ content }) {
  const mediaPlayerRef = useRef(null);
  const { t } = useTranslation('mediaAnalysis');
  const clientConfig = useService(ClientConfig);

  const [isPlaying, setIsPlaying] = useState(false);
  const [viewingChapterIndex, setViewingChapterIndex] = useState(0);
  const [chapterIndexRequestedToView, setChapterIndexRequestedToView] = useState(-1);

  const [areTextsExpanded, setAreTextsExpanded] = useState(false);

  const { playbackRange, copyrightNotice, chapters, showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const sourceUrl = getAccessibleUrl({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  const canRenderMediaPlayer = !!sourceUrl;

  const playerParts = chapters.map(chapter => ({ startPosition: chapter.startPosition }));

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleChaptersTextsToggleClick = () => {
    setAreTextsExpanded(prevValue => !prevValue);
  };

  const handleChapterSegmentClick = chapterIndex => {
    setChapterIndexRequestedToView(chapterIndex);

    if (isPlaying) {
      mediaPlayerRef.current.seekToPart(chapterIndex);
    } else {
      mediaPlayerRef.current.play();
      setTimeout(() => mediaPlayerRef.current.seekToPart(chapterIndex), 0);
    }
  };

  const handlePlayingPartIndexChange = index => {
    if (chapterIndexRequestedToView >= 0) {
      // wait until parts border is crossed to desired part,
      // as sometimes previous part index triggers the event right before the desired part does as well
      if (chapterIndexRequestedToView === index) {
        setViewingChapterIndex(chapterIndexRequestedToView);
        setChapterIndexRequestedToView(-1);
      }
    } else if (index >= 0) {
      setViewingChapterIndex(index);
    }
  };

  const determineChapterSegmentWidthInPercentage = chapterIndex => {
    const startPosition = chapters[chapterIndex]?.startPosition || 0;
    const nextStartPosition = chapters[chapterIndex + 1]?.startPosition || 1;
    return (nextStartPosition - startPosition) * 100;
  };

  const renderChapterSegment = (chapter, index) => {
    const widthInPercentage = determineChapterSegmentWidthInPercentage(index);

    const title = (
      <div
        key={chapter.key}
        className={classNames(
          'MediaAnalysisDisplay-chapterSegment',
          { 'MediaAnalysisDisplay-chapterSegment--interactive': canRenderMediaPlayer }
        )}
        style={{
          width: `${widthInPercentage}%`,
          backgroundColor: `${chapter.color}`,
          color: `${getContrastColor(chapter.color)}`
        }}
        onClick={canRenderMediaPlayer ? () => handleChapterSegmentClick(index) : null}
        >
        {chapter.title}
      </div>
    );
    return canRenderMediaPlayer
      ? <Tooltip key={chapter.key} title={t('startPlaybackFromHere')}>{title}</Tooltip>
      : title;
  };

  const renderChapterPointerTop = (chapter, index) => {
    const widthInPercentage = determineChapterSegmentWidthInPercentage(index);

    return (
      <Tooltip key={chapter.key} title={t('chapterPointerTooltip')} placement="bottom">
        <div
          style={{ width: `${widthInPercentage}%` }}
          className={classNames('MediaAnalysisDisplay-chapterPointerTop', { 'is-visible': index === viewingChapterIndex })}
          onClick={() => setViewingChapterIndex(index)}
          />
      </Tooltip>
    );
  };

  const renderChapterPointerBottom = (chapter, index) => {
    const widthInPercentage = determineChapterSegmentWidthInPercentage(index);

    return (
      <div
        key={chapter.key}
        style={{ width: `${widthInPercentage}%` }}
        className={classNames('MediaAnalysisDisplay-chapterPointerBottom', { 'is-visible': index === viewingChapterIndex })}
        />
    );
  };

  const renderChapters = () => {
    return (
      <div className="MediaAnalysisDisplay-chapters">
        <div className="MediaAnalysisDisplay-chapterSegments">
          {chapters.map(renderChapterSegment)}
        </div>

        {chapters.some(chapter => chapter.text) && (
          <Fragment>
            <div className="MediaAnalysisDisplay-chapterPointersTop">
              {chapters.map(renderChapterPointerTop)}
            </div>
            <div className="MediaAnalysisDisplay-viewedChapterInfoContainer">
              <div className="MediaAnalysisDisplay-viewedChapterInfoContent">
                {chapters.map((chapter, index) => (
                  <div key={chapter.key} className={classNames('MediaAnalysisDisplay-viewedChapterInfo', { 'is-visible': index === viewingChapterIndex })}>
                    <div className="MediaAnalysisDisplay-viewedChapterInfoTitle">
                      {chapter.title}
                    </div>
                    <Markdown className={classNames('MediaAnalysisDisplay-viewedChapterInfoText', { 'is-expanded': areTextsExpanded })}>
                      {chapter.text}
                    </Markdown>
                  </div>
                ))}
              </div>
              <a
                onClick={handleChaptersTextsToggleClick}
                className="MediaAnalysisDisplay-viewedChapterInfoExpand"
                >
                {areTextsExpanded ? t('common:less') : t('common:more')}
              </a>
            </div>
            <div className="MediaAnalysisDisplay-chapterPointersBottom">
              {chapters.map(renderChapterPointerBottom)}
            </div>
          </Fragment>
        )}
      </div>
    );
  };

  const allowDownload = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="MediaAnalysisDisplay">
      <div className={`MediaAnalysisDisplay-content u-width-${width || 100}`}>
        {!!canRenderMediaPlayer && (
          <Fragment>
            <MediaPlayer
              allowDownload={allowDownload}
              allowFullscreen={showVideo}
              allowLoop
              allowPlaybackRate
              aspectRatio={aspectRatio}
              initialVolume={initialVolume}
              customUnderScreenContent={renderChapters()}
              mediaPlayerRef={mediaPlayerRef}
              posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              parts={playerParts}
              playbackRange={playbackRange}
              screenMode={showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              sourceUrl={sourceUrl}
              onEnded={handleEnded}
              onPause={handlePause}
              onPlay={handlePlay}
              onPlayingPartIndexChange={handlePlayingPartIndexChange}
              />
            <CopyrightNotice value={copyrightNotice} />
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

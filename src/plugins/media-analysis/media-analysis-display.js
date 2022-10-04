import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import Markdown from '../../components/markdown.js';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MediaAnalysisDisplay({ content }) {
  const playerRef = useRef(null);
  const { t } = useTranslation('mediaAnalysis');
  const clientConfig = useService(ClientConfig);
  const [areTextsExpanded, setAreTextsExpanded] = useState(false);

  const { width, mainTrack, secondaryTracks, chapters } = content;

  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: mainTrack.volume,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: urlUtils.getMediaUrl({
        sourceUrl: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: track.volume
    }))
  };

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)]
    .filter(text => !!text).join('\n\n');

  const handleChaptersTextsToggleClick = () => {
    setAreTextsExpanded(prevValue => !prevValue);
  };

  const determineChapterWidthInPercentage = chapterIndex => {
    const startPosition = chapters[chapterIndex]?.startPosition || 0;
    const nextStartPosition = chapters[chapterIndex + 1]?.startPosition || 1;
    return (nextStartPosition - startPosition) * 100;
  };

  const renderChapterTitle = (chapter, index) => {
    const widthInPercentage = determineChapterWidthInPercentage(index);
    return (
      <div
        key={chapter.key}
        className="MediaAnalysisDisplay-chapterTitle"
        style={{
          width: `${widthInPercentage}%`,
          backgroundColor: `${chapter.color}`,
          color: `${getContrastColor(chapter.color)}`
        }}
        >
        {chapter.title}
      </div>
    );
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
        {chapterTextsAreSet && (
          <Fragment>
            <div className={classNames('MediaAnalysisDisplay-chapterTexts', { 'is-expanded': areTextsExpanded })}>
              {chapters.map(renderChapterText)}
            </div>
            <a onClick={handleChaptersTextsToggleClick} className="MediaAnalysisDisplay-chaptersTextsToggle">
              {areTextsExpanded ? t('less') : t('more')}
            </a>
          </Fragment>
        )}
      </div>
    );
  };

  const canRenderMediaPlayer = sources.mainTrack.sourceUrl && sources.secondaryTracks.every(track => track.sourceUrl);

  return (
    <div className="MediaAnalysisDisplay">
      <div className={`MediaAnalysisDisplay-content u-width-${width || 100}`}>
        {canRenderMediaPlayer && (
          <Fragment>
            <MultitrackMediaPlayer
              parts={chapters}
              sources={sources}
              aspectRatio={mainTrack.aspectRatio}
              screenMode={mainTrack.showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.none}
              mediaPlayerRef={playerRef}
              showTrackMixer={secondaryTracks.length > 0}
              extraCustomContent={renderChapters()}
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

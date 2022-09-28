import React, { Fragment, useRef } from 'react';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getContrastColor } from '../../ui/color-helper.js';
import { getFullSourceUrl } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MultitrackMediaPlayer from '../../components/media-player/multitrack-media-player.js';

function MediaAnalysisDisplay({ content }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);

  const { width, mainTrack, secondaryTracks, chapters } = content;

  const sources = {
    mainTrack: {
      name: mainTrack.name,
      sourceUrl: getFullSourceUrl({
        url: mainTrack.sourceUrl,
        sourceType: mainTrack.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: mainTrack.volume,
      playbackRange: mainTrack.playbackRange
    },
    secondaryTracks: secondaryTracks.map(track => ({
      name: track.name,
      sourceUrl: getFullSourceUrl({
        url: track.sourceUrl,
        sourceType: track.sourceType,
        cdnRootUrl: clientConfig.cdnRootUrl
      }),
      volume: track.volume
    }))
  };

  const combinedCopyrightNotice = [mainTrack.copyrightNotice, ...secondaryTracks.map(track => track.copyrightNotice)]
    .filter(text => !!text).join('\n\n');

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
        className="MediaAnalysisDisplay-chapterText"
        style={{ width: `${widthInPercentage}%` }}
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
          <div className="MediaAnalysisDisplay-chapterTexts">
            {chapters.map(renderChapterText)}
          </div>
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
              showTrackMixer
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

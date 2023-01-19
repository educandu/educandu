import { CHAPTER_TYPE } from './constants.js';
import { cssUrl } from '../../utils/css-utils.js';
import Markdown from '../../components/markdown.js';
import { preloadImage } from '../../utils/image-utils.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';

function MediaSlideshowDisplay({ content }) {
  const { width, playbackRange, copyrightNotice, chapters } = content;

  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const [playingChapterIndex, setPlayingChapterIndex] = useState(0);

  const sourceUrl = getAccessibleUrl({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  useEffect(() => {
    (async () => {
      const imageUrls = chapters
        .map(chapter => getAccessibleUrl({ url: chapter.image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl }))
        .filter(url => url);
      await Promise.all(imageUrls.map(url => preloadImage(url)));
    })();
  }, [clientConfig.cdnRootUrl, chapters]);

  const handlePlayingPartIndexChange = partIndex => {
    setPlayingChapterIndex(Math.max(partIndex, 0));
  };

  const renderPlayingChapterImage = () => {
    const { sourceUrl: imageSourceUrl, fit: imageFit } = chapters[playingChapterIndex].image;
    const imageUrl = getAccessibleUrl({ url: imageSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="MediaSlideshow-chapterImageOverlayWrapper">
        <div
          className="MediaSlideshow-chapterImageOverlay"
          style={{ backgroundImage: cssUrl(imageUrl), backgroundSize: imageFit }}
          />
      </div>
    );
  };

  const renderPlayingChapterText = () => {
    return (
      <div className="MediaSlideshow-chapterTextOverlayWrapper">
        <Markdown>{chapters[playingChapterIndex].text}</Markdown>
      </div>
    );
  };

  const renderPlayingChapter = () => {
    return chapters[playingChapterIndex].type === CHAPTER_TYPE.image
      ? renderPlayingChapterImage()
      : renderPlayingChapterText();
  };

  const canDownload = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="MediaSlideshowDisplay">
      <div className={`MediaSlideshowDisplay-content u-width-${width || 100}`}>
        <MediaPlayer
          parts={chapters}
          sourceUrl={sourceUrl}
          canDownload={canDownload}
          playbackRange={playbackRange}
          mediaPlayerRef={mediaPlayerRef}
          screenMode={MEDIA_SCREEN_MODE.audio}
          aspectRatio={MEDIA_ASPECT_RATIO.sixteenToNine}
          customScreenOverlay={renderPlayingChapter()}
          onPlayingPartIndexChange={handlePlayingPartIndexChange}
          />
        <CopyrightNotice value={copyrightNotice} />
        {chapters[playingChapterIndex].type === CHAPTER_TYPE.image && (
          <CopyrightNotice value={chapters[playingChapterIndex].image.copyrightNotice} />
        )}
      </div>
    </div>
  );
}

MediaSlideshowDisplay.propTypes = {
  ...sectionDisplayProps
};

export default MediaSlideshowDisplay;

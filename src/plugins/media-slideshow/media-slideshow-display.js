import { CHAPTER_TYPE } from './constants.js';
import urlUtils from '../../utils/url-utils.js';
import { cssUrl } from '../../utils/css-utils.js';
import Markdown from '../../components/markdown.js';
import { preloadImage } from '../../utils/image-utils.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

function MediaSlideshowDisplay({ content }) {
  const { sourceType, width, playbackRange, copyrightNotice, chapters } = content;

  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const [playingChapterIndex, setPlayingChapterIndex] = useState(0);

  const sourceUrl = urlUtils.getMediaUrl({
    cdnRootUrl: clientConfig.cdnRootUrl,
    sourceType: content.sourceType,
    sourceUrl: content.sourceUrl
  });

  useEffect(() => {
    (async () => {
      const imageUrls = chapters
        .map(chapter => urlUtils.getImageUrl({
          cdnRootUrl: clientConfig.cdnRootUrl,
          sourceType: chapter.image.sourceType,
          sourceUrl: chapter.image.sourceUrl
        }))
        .filter(url => url);
      await Promise.all(imageUrls.map(url => preloadImage(url)));
    })();
  }, [clientConfig.cdnRootUrl, chapters]);

  const handlePlayingPartIndexChange = partIndex => {
    setPlayingChapterIndex(partIndex);
  };

  const renderPlayingChapterImage = () => {
    const {
      sourceType: imageSourceType,
      sourceUrl: imageSourceUrl,
      fit: imageFit
    } = chapters[playingChapterIndex].image;

    const imageUrl = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: imageSourceType,
      sourceUrl: imageSourceUrl
    });

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

  return (
    <div className="MediaSlideshowDisplay">
      <div className={`MediaSlideshowDisplay-content u-width-${width || 100}`}>
        <MediaPlayer
          mediaPlayerRef={mediaPlayerRef}
          parts={chapters}
          source={sourceUrl}
          screenMode={MEDIA_SCREEN_MODE.overlay}
          aspectRatio={MEDIA_ASPECT_RATIO.sixteenToNine}
          playbackRange={playbackRange}
          canDownload={sourceType === MEDIA_SOURCE_TYPE.internal}
          screenOverlay={renderPlayingChapter()}
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

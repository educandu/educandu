import { Button } from 'antd';
import React, { useState } from 'react';
import Markdown from '../../components/markdown.js';
import { StepForwardOutlined } from '@ant-design/icons';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

function InteractiveMediaDisplay({ content }) {
  const clientConfig = useService(ClientConfig);
  const [isPausingAtChapterEnd, setIsPausingAtChapterEnd] = useState();

  let sourceUrl;
  switch (content.sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }
  const marks = content.chapters.reduce((accu, chapter) => {
    if (chapter.startTimecode > 0) {
      accu[chapter.startTimecode] = formatMillisecondsAsDuration(chapter.startTimecode);
    }
    return accu;
  }, {});

  const handleMarkReached = () => {
    setIsPausingAtChapterEnd(true);
  };

  const handleNextChapterClick = () => {
    setIsPausingAtChapterEnd(false);
  };

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            marks={marks}
            sourceUrl={sourceUrl}
            pauseCue={isPausingAtChapterEnd}
            audioOnly={!content.showVideo}
            aspectRatio={content.aspectRatio}
            startTimecode={content.sourceStartTimecode}
            stopTimecode={content.sourceStopTimecode}
            onMarkReached={handleMarkReached}
            />
        )}
        {isPausingAtChapterEnd && (
          <div className="InteractiveMediaDisplay-overlay">
            <Button type="link" icon={<StepForwardOutlined />} onClick={handleNextChapterClick}>next chapter</Button>
          </div>
        )}
        {content.text && (
          <div className="InteractiveMediaDisplay-text">
            <Markdown>{content.text}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

InteractiveMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default InteractiveMediaDisplay;

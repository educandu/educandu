import { Button } from 'antd';
import React, { useRef, useState } from 'react';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { StepForwardOutlined, UndoOutlined } from '@ant-design/icons';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

function InteractiveMediaDisplay({ content }) {
  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const [interactingChapterIndex, setInteractingChapterIndex] = useState();

  let sourceUrl;
  switch (content.sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }

  const marks = content.chapters
    .map(chapter => chapter.startTimecode === 0
      ? null
      : { key: chapter.key, timecode: chapter.startTimecode, text: formatMillisecondsAsDuration(chapter.startTimecode) })
    .filter(mark => mark);

  const handleMarkReached = nextChapterMark => {
    mediaPlayerRef.current.pause();
    const nextChapterIndex = content.chapters.findIndex(chapter => chapter.key === nextChapterMark.key);
    setInteractingChapterIndex(nextChapterIndex - 1);
  };

  const handleEndReached = () => {
    setInteractingChapterIndex(content.chapters.length - 1);
  };

  const handleResetChaptersClick = () => {
    mediaPlayerRef.current.reset();
    setInteractingChapterIndex(-1);
  };

  const handleNextChapterClick = () => {
    const nextChapterMark = marks.find(m => m.key === content.chapters[interactingChapterIndex + 1].key);

    mediaPlayerRef.current.seekToMark(nextChapterMark);
    mediaPlayerRef.current.play();

    setInteractingChapterIndex(-1);
  };

  const handleReplayChapterClick = () => {
    const currentChapterMark = marks.find(m => m.key === content.chapters[interactingChapterIndex].key);

    if (currentChapterMark) {
      mediaPlayerRef.current.seekToMark(currentChapterMark);
    } else {
      mediaPlayerRef.current.reset();
    }

    mediaPlayerRef.current.play();
    setInteractingChapterIndex(-1);
  };

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${content.width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            mediaPlayerRef={mediaPlayerRef}
            marks={marks}
            sourceUrl={sourceUrl}
            audioOnly={!content.showVideo}
            aspectRatio={content.aspectRatio}
            startTimecode={content.sourceStartTimecode}
            stopTimecode={content.sourceStopTimecode}
            onMarkReached={handleMarkReached}
            onEndReached={handleEndReached}
            />
        )}
        {interactingChapterIndex >= 0 && (
          <div className="InteractiveMediaDisplay-overlay">
            <Button type="link" icon={<UndoOutlined />} onClick={handleReplayChapterClick}>replay chapter</Button>
            {interactingChapterIndex < content.chapters.length - 1 && (
              <Button type="link" icon={<StepForwardOutlined />} onClick={handleNextChapterClick}>next chapter</Button>
            )}
            {interactingChapterIndex === content.chapters.length - 1 && (
              <Button type="link" icon={<StepForwardOutlined />} onClick={handleResetChaptersClick}>reset chapters</Button>
            )}
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

import { Button, Radio, Space } from 'antd';
import React, { useRef, useState } from 'react';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { StepForwardOutlined, UndoOutlined } from '@ant-design/icons';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

const RadioGroup = Radio.Group;

function InteractiveMediaDisplay({ content }) {
  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const [interactingChapterIndex, setInteractingChapterIndex] = useState(-1);

  const { sourceType, aspectRatio, showVideo, width, sourceStartTimecode, sourceStopTimecode, text, chapters } = content;

  let sourceUrl;
  switch (sourceType) {
    case MEDIA_SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }

  const marks = chapters
    .map(chapter => chapter.startTimecode === 0
      ? null
      : { key: chapter.key, timecode: chapter.startTimecode, text: formatMillisecondsAsDuration(chapter.startTimecode) })
    .filter(mark => mark);

  const handleMarkReached = nextChapterMark => {
    mediaPlayerRef.current.pause();
    const nextChapterIndex = chapters.findIndex(chapter => chapter.key === nextChapterMark.key);
    setInteractingChapterIndex(nextChapterIndex - 1);
  };

  const handleEndReached = () => {
    setInteractingChapterIndex(chapters.length - 1);
  };

  const handleResetChaptersClick = () => {
    mediaPlayerRef.current.reset();
    setInteractingChapterIndex(-1);
  };

  const handleNextChapterClick = () => {
    const nextChapterMark = marks.find(m => m.key === chapters[interactingChapterIndex + 1].key);

    mediaPlayerRef.current.seekToMark(nextChapterMark);
    mediaPlayerRef.current.play();

    setInteractingChapterIndex(-1);
  };

  const handleReplayChapterClick = () => {
    const currentChapterMark = marks.find(m => m.key === chapters[interactingChapterIndex].key);

    if (currentChapterMark) {
      mediaPlayerRef.current.seekToMark(currentChapterMark);
    } else {
      mediaPlayerRef.current.reset();
    }

    mediaPlayerRef.current.play();
    setInteractingChapterIndex(-1);
  };

  const renderAnswer = (answer, index) => (
    <Radio value={index} key={index}><Markdown inline>{answer}</Markdown></Radio>
  );

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${width || 100}`}>
        {sourceUrl && (
          <MediaPlayer
            mediaPlayerRef={mediaPlayerRef}
            marks={marks}
            sourceUrl={sourceUrl}
            screenMode={showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.audio}
            aspectRatio={aspectRatio}
            startTimecode={sourceStartTimecode}
            stopTimecode={sourceStopTimecode}
            onMarkReached={handleMarkReached}
            onEndReached={handleEndReached}
            canDownload={sourceType === MEDIA_SOURCE_TYPE.internal}
            />
        )}
        {interactingChapterIndex >= 0 && (
          <div className="InteractiveMediaDisplay-overlay">
            <span className="InteractiveMediaDisplay-overlayTitle">{chapters[interactingChapterIndex].title}</span>

            <div className="InteractiveMediaDisplay-overlayContent">
              <Markdown>{chapters[interactingChapterIndex].question}</Markdown>
              <RadioGroup className="InteractiveMediaDisplay-chapterAnswers">
                <Space direction="vertical">
                  {chapters[interactingChapterIndex].answers.map(renderAnswer)}
                </Space>
              </RadioGroup>
            </div>

            <div className="InteractiveMediaDisplay-overlayControls">
              <Button type="link" icon={<UndoOutlined />} onClick={handleReplayChapterClick}>replay chapter</Button>
              {interactingChapterIndex < chapters.length - 1 && (
              <Button type="link" icon={<StepForwardOutlined />} onClick={handleNextChapterClick}>next chapter</Button>
              )}
              {interactingChapterIndex === chapters.length - 1 && (
              <Button type="link" icon={<StepForwardOutlined />} onClick={handleResetChaptersClick}>reset chapters</Button>
              )}
            </div>
          </div>
        )}
        {text && (
          <div className="InteractiveMediaDisplay-text">
            <Markdown>{text}</Markdown>
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

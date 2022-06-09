import { Button, Radio, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import Markdown from '../../components/markdown.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { StepForwardOutlined, UndoOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const RadioGroup = Radio.Group;

function InteractiveMediaDisplay({ content }) {
  const { sourceType, aspectRatio, showVideo, width, sourceStartTimecode, sourceStopTimecode, text, chapters } = content;

  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');

  const getDefaultSelectedAnswersPerChapter = () => chapters.reduce((accu, _chapter, index) => ({ ...accu, [index]: null }), {});

  const [interactingChapterIndex, setInteractingChapterIndex] = useState(-1);
  const [selectedAnswerPerChapter, setSelectedAnswerPerChapter] = useState(getDefaultSelectedAnswersPerChapter());

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
    setSelectedAnswerPerChapter(getDefaultSelectedAnswersPerChapter());
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

  const handleAnswerIndexChange = event => {
    const { value } = event.target;

    if (selectedAnswerPerChapter[interactingChapterIndex] === null) {
      const newSelectedAnswerPerChapter = cloneDeep(selectedAnswerPerChapter);
      newSelectedAnswerPerChapter[interactingChapterIndex] = {
        answerIndex: value,
        isCorrectAnswerIndex: chapters[interactingChapterIndex].correctAnswerIndex === value
      };
      setSelectedAnswerPerChapter(newSelectedAnswerPerChapter);
    }
  };

  const renderAnswerRadio = (answer, index) => {
    const isCurrentAnswerSelected = selectedAnswerPerChapter[interactingChapterIndex]?.answerIndex === index;
    const isCorrectAnswerSelected = isCurrentAnswerSelected && selectedAnswerPerChapter[interactingChapterIndex].isCorrectAnswerIndex;
    const isWrongAnswerSelected = isCurrentAnswerSelected && !selectedAnswerPerChapter[interactingChapterIndex].isCorrectAnswerIndex;

    return (
      <Radio value={index} key={index}>
        <div className="InteractiveMediaDisplay-answer">
          <Markdown inline>{answer}</Markdown>
          <div className="InteractiveMediaDisplay-answerMark">
            {isCorrectAnswerSelected && <div className="InteractiveMediaDisplay-correctAnswerMark"><CheckOutlined /></div>}
            {isWrongAnswerSelected && <div className="InteractiveMediaDisplay-wrongAnswerMark"><CloseOutlined /></div>}
          </div>
        </div>
      </Radio>
    );
  };

  const renderChapterResolution = (answerPerChapter, index) => {
    const classNames = ['InteractiveMediaDisplay-chapterResolution'];
    if (answerPerChapter?.isCorrectAnswerIndex === true) {
      classNames.push('InteractiveMediaDisplay-chapterResolution--correctAnswer');
    }
    if (answerPerChapter?.isCorrectAnswerIndex === false) {
      classNames.push('InteractiveMediaDisplay-chapterResolution--wrongAnswer');
    }

    return (
      <div key={index} className="InteractiveMediaDisplay-chapterResolutionContainer">
        <div className={classNames.join(' ')} />
      </div>
    );
  };

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
            <div className="InteractiveMediaDisplay-overlayTitle">{chapters[interactingChapterIndex].title}</div>

            <div className="InteractiveMediaDisplay-overlayContent">
              <Markdown>{chapters[interactingChapterIndex].question}</Markdown>
              <RadioGroup
                onChange={handleAnswerIndexChange}
                className="InteractiveMediaDisplay-answers"
                value={selectedAnswerPerChapter[interactingChapterIndex]?.answerIndex}
                >
                <Space direction="vertical">
                  {chapters[interactingChapterIndex].answers.map(renderAnswerRadio)}
                </Space>
              </RadioGroup>
            </div>

            <div className="InteractiveMediaDisplay-overlayControls">
              <Button icon={<UndoOutlined />} onClick={handleReplayChapterClick}>{t('replay')}</Button>
              {interactingChapterIndex < chapters.length - 1 && (
                <Button type="primary" icon={<StepForwardOutlined />} onClick={handleNextChapterClick}>{t('continue')}</Button>
              )}
              {interactingChapterIndex === chapters.length - 1 && (
                <Button type="primary" icon={<StepForwardOutlined />} onClick={handleResetChaptersClick}>{t('reset')}</Button>
              )}
            </div>
          </div>
        )}
        {text && (
          <div className="InteractiveMediaDisplay-text">
            <Markdown>{text}</Markdown>
          </div>
        )}
        <div className="InteractiveMediaDisplay-chaptersResolution">
          <span className="InteractiveMediaDisplay-chaptersResolutionLabel">{t('currentProgress')}:</span>
          {Object.values(selectedAnswerPerChapter).map(renderChapterResolution)}
        </div>
      </div>
    </div>
  );
}

InteractiveMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default InteractiveMediaDisplay;

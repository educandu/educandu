import { Button, Radio, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import Markdown from '../../components/markdown.js';
import React, { useMemo, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import IterationPanel from '../../components/iteration-panel.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { ensureIsIncluded, replaceItemAt } from '../../utils/array-utils.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { CheckOutlined, CloseOutlined, LeftOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';

const RadioGroup = Radio.Group;

function InteractiveMediaDisplay({ content }) {
  const { playbackRange, aspectRatio, showVideo, posterImage, copyrightNotice, width, initialVolume, chapters } = content;

  const mediaPlayerRef = useRef();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');

  const [isMediaReady, setIsMediaReady] = useState(false);
  const [visitedChapters, setVisitedChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [interactingChapterIndex, setInteractingChapterIndex] = useState(-1);
  const [selectedAnswerPerChapter, setSelectedAnswerPerChapter] = useState(chapters.map(() => -1));

  const playerParts = useMemo(() => chapters.map(chapter => ({ startPosition: chapter.startPosition })), [chapters]);

  const chapterCards = useMemo(() => chapters.map((chapter, index) => ({
    label: (index + 1).toString(),
    tooltip: chapter.title
  })), [chapters]);

  const sourceUrl = getAccessibleUrl({ url: content.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  const handleMediaReady = () => {
    setIsMediaReady(true);
  };

  const handlePartEndReached = partIndex => {
    setInteractingChapterIndex(partIndex);
    mediaPlayerRef.current.pause();
    setVisitedChapters(ensureIsIncluded(visitedChapters, partIndex));
  };

  const handleSeek = () => {
    setInteractingChapterIndex(-1);
  };

  const handleResetChaptersClick = () => {
    mediaPlayerRef.current.reset();
    setSelectedAnswerPerChapter(chapters.map(() => -1));
    setInteractingChapterIndex(-1);
    setVisitedChapters([]);
  };

  const handleGotoChapterClick = chapterIndex => {
    setInteractingChapterIndex(-1);
    mediaPlayerRef.current.play();
    mediaPlayerRef.current.seekToPart(chapterIndex);
  };

  const handleNextChapterClick = () => {
    handleGotoChapterClick(currentChapterIndex + 1);
  };

  const handleReplayChapterClick = () => {
    handleGotoChapterClick(currentChapterIndex);
  };

  const handleAnswerIndexChange = event => {
    const { value } = event.target;
    setSelectedAnswerPerChapter(replaceItemAt(selectedAnswerPerChapter, value, interactingChapterIndex));
  };

  const renderAnswerRadio = (answer, index) => {
    const correctAnswerIndex = chapters[interactingChapterIndex].correctAnswerIndex;
    const userSelectedAnswerIndex = selectedAnswerPerChapter[interactingChapterIndex];
    const isCurrentAnswerSelected = userSelectedAnswerIndex === index;
    const isCorrectAnswerSelected = isCurrentAnswerSelected && userSelectedAnswerIndex === correctAnswerIndex;
    const isIncorrectAnswerSelected = isCurrentAnswerSelected && userSelectedAnswerIndex !== correctAnswerIndex;

    return (
      <Radio value={index} key={index}>
        <div className="InteractiveMediaDisplay-overlayChapterAnswer">
          <Markdown tag="div" inline>{answer}</Markdown>
          <div className="InteractiveMediaDisplay-answerMark">
            {!!isCorrectAnswerSelected && <div className="InteractiveMediaDisplay-correctAnswerMark"><CheckOutlined /></div>}
            {!!isIncorrectAnswerSelected && <div className="InteractiveMediaDisplay-incorrectAnswerMark"><CloseOutlined /></div>}
          </div>
        </div>
      </Radio>
    );
  };

  const renderInteractionOverlay = () => {
    if (interactingChapterIndex === -1) {
      return null;
    }

    return (
      <div className="InteractiveMediaDisplay-overlay">
        <div className="InteractiveMediaDisplay-overlayChapterTitle">{chapters[interactingChapterIndex].title}</div>
        <div className="InteractiveMediaDisplay-overlayChapterContent">
          <Markdown>{chapters[interactingChapterIndex].text}</Markdown>
          <RadioGroup
            onChange={handleAnswerIndexChange}
            className="InteractiveMediaDisplay-overlayChapterAnswers"
            value={selectedAnswerPerChapter[interactingChapterIndex]}
            >
            <Space direction="vertical">
              {chapters[interactingChapterIndex].answers.map(renderAnswerRadio)}
            </Space>
          </RadioGroup>
        </div>
        <div className="InteractiveMediaDisplay-overlayChapterControls">
          <Button icon={<LeftOutlined />} onClick={handleReplayChapterClick}>{t('replay')}</Button>
          {interactingChapterIndex < chapters.length - 1 && (
            <Button type="primary" icon={<RightOutlined />} onClick={handleNextChapterClick}>{t('continue')}</Button>
          )}
          {interactingChapterIndex === chapters.length - 1 && (
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleResetChaptersClick}>{t('common:reset')}</Button>
          )}
        </div>
      </div>
    );
  };

  const canDownload = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  return (
    <div className="InteractiveMediaDisplay">
      <div className={`InteractiveMediaDisplay-content u-width-${width || 100}`}>
        <MediaPlayer
          aspectRatio={aspectRatio}
          canDownload={canDownload}
          customScreenOverlay={renderInteractionOverlay()}
          initialVolume={initialVolume}
          mediaPlayerRef={mediaPlayerRef}
          parts={playerParts}
          playbackRange={playbackRange}
          posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
          screenMode={showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.audio}
          sourceUrl={sourceUrl}
          onPartEndReached={handlePartEndReached}
          onPlayingPartIndexChange={setCurrentChapterIndex}
          onReady={handleMediaReady}
          onSeek={handleSeek}
          />
        {!!sourceUrl && (
          <div className="InteractiveMediaDisplay-progressBar">
            <div className="InteractiveMediaDisplay-progressBarCards">
              <div>
                {t('currentProgress')}:
              </div>
              <CardSelector
                cards={chapterCards}
                selectedCardIndex={currentChapterIndex}
                visitedCardIndices={visitedChapters}
                onCardSelected={handleGotoChapterClick}
                disabled={!isMediaReady}
                />
            </div>
            <IterationPanel
              itemCount={chapters.length}
              selectedItemIndex={currentChapterIndex}
              onPreviousClick={handleReplayChapterClick}
              onResetClick={handleResetChaptersClick}
              onNextClick={handleNextChapterClick}
              disabled={!isMediaReady}
              alwaysAllowPreviousClick
              />
          </div>
        )}
        <CopyrightNotice value={copyrightNotice} />
      </div>
    </div>
  );
}

InteractiveMediaDisplay.propTypes = {
  ...sectionDisplayProps
};

export default InteractiveMediaDisplay;

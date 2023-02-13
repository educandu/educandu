import by from 'thenby';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { Button, Form, Input, Tooltip } from 'antd';
import ItemPanel from '../../components/item-panel.js';
import { removeItemAt } from '../../utils/array-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DeleteButton from '../../components/delete-button.js';
import MarkdownInput from '../../components/markdown-input.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import MediaPlayer from '../../components/media-player/media-player.js';
import TrackEditor from '../../components/media-player/track-editor.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { formatMediaPosition, shouldDisableVideo } from '../../utils/media-utils.js';
import PlayerSettingsEditor from '../../components/media-player/player-settings-editor.js';
import TimecodeFineTunningInput from '../../components/media-player/timecode-fine-tunning-input.js';
import { FORM_ITEM_LAYOUT, MEDIA_SCREEN_MODE, FORM_ITEM_LAYOUT_WITHOUT_LABEL } from '../../domain/constants.js';

const FormItem = Form.Item;

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function InteractiveMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');
  const interactiveMediaInfo = useService(InteractiveMediaInfo);
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [disableVideo, setDisableVideo] = useState(shouldDisableVideo(content.sourceUrl));

  const { sourceUrl, playbackRange, aspectRatio, showVideo, posterImage, initialVolume, chapters } = content;

  const [mediaDuration] = useMediaDurations([getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })]);
  const sourceDuration = mediaDuration.duration;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  const selectedChapterStartTimecode = useMemo(
    () => chapters[selectedChapterIndex].startPosition * playbackDuration,
    [chapters, selectedChapterIndex, playbackDuration]
  );

  const selectedChapterLowerTimecodeLimit = useMemo(
    () => {
      const previousChapter = chapters[selectedChapterIndex - 1];
      return previousChapter ? previousChapter.startPosition * playbackDuration : 0;
    },
    [chapters, selectedChapterIndex, playbackDuration]
  );

  const selectedChapterUpperTimecodeLimit = useMemo(
    () => {
      const nextChapter = chapters[selectedChapterIndex + 1];
      return nextChapter ? nextChapter.startPosition * playbackDuration : playbackDuration;
    },
    [chapters, selectedChapterIndex, playbackDuration]
  );

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const newDisableVideo = shouldDisableVideo(newContent.sourceUrl);

    const reEnableVideo = !content.showVideo;
    newContent.showVideo = newDisableVideo ? false : reEnableVideo || newContent.showVideo;
    newContent.posterImage = newDisableVideo ? { sourceUrl: '' } : newContent.posterImage;

    setDisableVideo(newDisableVideo);
    onContentChanged(newContent);
  };

  const handleTrackContentChange = changedContent => {
    changeContent(changedContent);
  };

  const handlePlayerSettingsContentChange = changedContent => {
    changeContent(changedContent);
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleChapterAdd = startPosition => {
    const chapter = { ...interactiveMediaInfo.getDefaultChapter(t), startPosition };
    const newChapters = ensureChaptersOrder([...chapters, chapter]);
    changeContent({ chapters: newChapters });
  };

  const handleChapterDelete = key => {
    const chapterIndex = chapters.findIndex(p => p.key === key);
    const deletedChapterStartPosition = chapters[chapterIndex].startPosition;
    const newChapters = removeItemAt(chapters, chapterIndex);
    const followingChapter = newChapters[chapterIndex];
    if (followingChapter) {
      followingChapter.startPosition = deletedChapterStartPosition;
    }
    if (selectedChapterIndex > newChapters.length - 1) {
      setSelectedChapterIndex(newChapters.length - 1);
    }
    changeContent({ chapters: newChapters });
  };

  const handleChapterClick = key => {
    const chapterIndex = chapters.findIndex(p => p.key === key);
    setSelectedChapterIndex(chapterIndex);
  };

  const handleChapterStartTimecodeChange = newStartTime => {
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], startPosition: newStartTime / playbackDuration };
    changeContent({ chapters: newChapters });
  };

  const handleChapterTitleChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], title: value };
    changeContent({ chapters: newChapters });
  };

  const handleChapterTextChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], text: value };
    changeContent({ chapters: newChapters });
  };

  const handleChapterAnswerChanged = (index, event) => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].answers[index] = value;
    changeContent({ chapters: newChapters });
  };

  const handleChapterAnswerMarkClick = index => {
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex].correctAnswerIndex = index;
    changeContent({ chapters: newChapters });
  };

  const handleChapterAnswerDeleteClick = index => {
    const newChapters = cloneDeep(chapters);
    const currentChapter = newChapters[selectedChapterIndex];

    currentChapter.answers = removeItemAt(currentChapter.answers, index);

    let newCorrectAnswerIndex;
    if (index > currentChapter.correctAnswerIndex) {
      newCorrectAnswerIndex = currentChapter.correctAnswerIndex;
    } else if (index < currentChapter.correctAnswerIndex) {
      newCorrectAnswerIndex = currentChapter.correctAnswerIndex - 1;
    } else {
      newCorrectAnswerIndex = currentChapter.answers.length ? 0 : -1;
    }

    currentChapter.correctAnswerIndex = newCorrectAnswerIndex;

    changeContent({ chapters: newChapters });
  };

  const handleNewChapterAnswerClick = () => {
    const newChapters = cloneDeep(chapters);
    const currentChapter = newChapters[selectedChapterIndex];

    currentChapter.answers.push(`[${t('common:answer')}]`);
    if (currentChapter.correctAnswerIndex === -1) {
      currentChapter.correctAnswerIndex = 0;
    }

    changeContent({ chapters: newChapters });
  };

  const renderAnswer = (answer, index) => (
    <div className="InteractiveMediaEditor-answer" key={index}>
      <MarkdownInput
        inline
        value={answer}
        disabled={!selectedChapterFraction}
        onChange={event => handleChapterAnswerChanged(index, event)}
        />
      <Tooltip title={t('markCorrectAnswer')}>
        <Button
          type="link"
          icon={<CheckOutlined />}
          className={classNames(
            'InteractiveMediaEditor-answerCheckmark',
            { 'is-active': chapters[selectedChapterIndex].correctAnswerIndex === index }
          )}
          disabled={!selectedChapterFraction}
          onClick={() => handleChapterAnswerMarkClick(index)}
          />
      </Tooltip>
      <DeleteButton onClick={() => handleChapterAnswerDeleteClick(index)} />
    </div>
  );

  return (
    <div className="InteractiveMediaEditor">
      <Form layout="horizontal" labelAlign="left">

        <ItemPanel header={t('common:track')}>
          <TrackEditor
            content={content}
            useName={false}
            onContentChange={handleTrackContentChange}
            />
        </ItemPanel>

        <ItemPanel header={t('common:player')}>
          <PlayerSettingsEditor
            content={content}
            disableVideo={disableVideo}
            onContentChange={handlePlayerSettingsContentChange}
            />
        </ItemPanel>

        <ItemPanel header={t('chapters')}>
          <div className="InteractiveMediaEditor-playerPreview">
            <div className="InteractiveMediaEditor-playerPreviewLabel">{t('common:preview')}</div>
            <MediaPlayer
              allowPartClick
              aspectRatio={aspectRatio}
              parts={chapters}
              playbackRange={playbackRange}
              posterImageUrl={getAccessibleUrl({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              screenWidth={50}
              screenMode={!disableVideo && showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.audio}
              sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              volume={initialVolume}
              />
          </div>

          <Timeline
            durationInMilliseconds={playbackDuration}
            parts={chapters}
            selectedPartIndex={selectedChapterIndex}
            onPartAdd={handleChapterAdd}
            onPartClick={handleChapterClick}
            onPartDelete={handleChapterDelete}
            onStartPositionChange={handleChapterStartPositionChange}
            />

          {!!chapters.length && (
          <Fragment>
            <FormItem label={t('common:startTimecode')} {...FORM_ITEM_LAYOUT}>
              {!playbackDuration && formatPercentage(chapters[selectedChapterIndex].startPosition)}
              {!!playbackDuration && (
                <TimecodeFineTunningInput
                  disabled={selectedChapterIndex === 0}
                  lowerLimit={selectedChapterLowerTimecodeLimit}
                  upperLimit={selectedChapterUpperTimecodeLimit}
                  value={selectedChapterStartTimecode}
                  onValueChange={handleChapterStartTimecodeChange}
                  />
              )}
            </FormItem>
            <FormItem label={t('common:duration')} {...FORM_ITEM_LAYOUT}>
              {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration, millisecondsLength: 3 })}
            </FormItem>
            <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
              <Input
                disabled={!selectedChapterFraction}
                onChange={handleChapterTitleChange}
                value={chapters[selectedChapterIndex].title}
                />
            </FormItem>
            <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
              <MarkdownInput
                preview
                disabled={!selectedChapterFraction}
                onChange={handleChapterTextChange}
                value={chapters?.[selectedChapterIndex].text || ''}
                />
            </FormItem>
            <FormItem {...FORM_ITEM_LAYOUT_WITHOUT_LABEL}>
              <div>{t('addAnswerInfo')}</div>
            </FormItem>
            <FormItem label={t('answers')} {...FORM_ITEM_LAYOUT}>
              {(chapters?.[selectedChapterIndex].answers || []).map(renderAnswer)}
              <Tooltip title={t('addAnswer')}>
                <Button
                  shape="circle"
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!selectedChapterFraction}
                  onClick={handleNewChapterAnswerClick}
                  />
              </Tooltip>
            </FormItem>
          </Fragment>
          )}
        </ItemPanel>
      </Form>
    </div>
  );
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;

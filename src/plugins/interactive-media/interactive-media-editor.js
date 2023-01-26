import by from 'thenby';
import classNames from 'classnames';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import cloneDeep from '../../utils/clone-deep.js';
import { removeItemAt } from '../../utils/array-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DeleteButton from '../../components/delete-button.js';
import React, { Fragment, useEffect, useState } from 'react';
import { Button, Divider, Form, Input, Tooltip } from 'antd';
import MarkdownInput from '../../components/markdown-input.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { formatMediaPosition } from '../../utils/media-utils.js';
import Timeline from '../../components/media-player/timeline.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MediaPlayer from '../../components/media-player/media-player.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import MainTrackEditor from '../../components/media-player/main-track-editor.js';
import { useMediaDurations } from '../../components/media-player/media-hooks.js';
import { getAccessibleUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { getUrlValidationStatus, URL_VALIDATION_STATUS } from '../../ui/validation.js';
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
  const { sourceUrl, playbackRange, chapters, width, showVideo } = content;

  const [mediaDuration] = useMediaDurations([getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })]);
  const sourceDuration = mediaDuration.duration;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalidSourceUrl = !isNewSourceTypeInternal && getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleMainTrackContentChange = changedContent => {
    changeContent({ ...changedContent });
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
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
        <MainTrackEditor
          content={content}
          onContentChanged={handleMainTrackContentChange}
          />
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>

        <Divider className="InteractiveMediaEditor-chapterEditorDivider" plain>{t('common:editChapter')}</Divider>

        <MediaPlayer
          parts={chapters}
          screenWidth={50}
          playbackRange={playbackRange}
          screenMode={showVideo ? MEDIA_SCREEN_MODE.video : MEDIA_SCREEN_MODE.audio}
          sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
          />

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
              <span className="InteractiveMediaEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:duration')} {...FORM_ITEM_LAYOUT}>
              <span className="InteractiveMediaEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
              </span>
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
      </Form>
    </div>
  );
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;

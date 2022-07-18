import by from 'thenby';
import classNames from 'classnames';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import cloneDeep from '../../utils/clone-deep.js';
import Timeline from '../../components/timeline.js';
import { handleError } from '../../ui/error-helper.js';
import { removeItemAt } from '../../utils/array-utils.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import DeleteButton from '../../components/delete-button.js';
import MarkdownInput from '../../components/markdown-input.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { getResourceType } from '../../utils/resource-utils.js';
import DebouncedInput from '../../components/debounced-input.js';
import ResourcePicker from '../../components/resource-picker.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MediaRangeSelector from '../../components/media-range-selector.js';
import { Button, Divider, Form, Input, Radio, Spin, Switch, Tooltip } from 'antd';
import { CheckOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE, RESOURCE_TYPE } from '../../domain/constants.js';
import { trimChaptersToFitRange, analyzeMediaUrl, determineMediaDuration, formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const tailFormItemLayout = {
  wrapperCol: {
    span: 14,
    offset: 4
  }
};
function InteractiveMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');
  const interactiveMediaInfo = useService(InteractiveMediaInfo);

  const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startTimecode));

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterDuration, setSelectedChapterDuration] = useState(0);
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, sourceDuration, sourceStartTimecode, sourceStopTimecode, chapters, copyrightNotice, width, aspectRatio, showVideo } = content;

  const playbackDuration = (sourceStopTimecode ?? sourceDuration) - (sourceStartTimecode ?? 0);

  useEffect(() => {
    const nextChapterStartTimecode = chapters[selectedChapterIndex + 1]?.startTimecode || sourceDuration;
    setSelectedChapterDuration(nextChapterStartTimecode - chapters[selectedChapterIndex].startTimecode);

  }, [chapters, sourceDuration, selectedChapterIndex]);

  const getFullSourceUrl = url => url && sourceType === MEDIA_SOURCE_TYPE.internal
    ? `${clientConfig.cdnRootUrl}/${url}`
    : url || null;

  const getMediaInformation = async url => {
    const unknownResult = {
      sanitizedUrl: url,
      duration: 0,
      startTimecode: null,
      stopTimecode: null,
      resourceType: RESOURCE_TYPE.unknown
    };

    if (!url) {
      return unknownResult;
    }

    try {
      const isInvalidSourceUrl = sourceType !== MEDIA_SOURCE_TYPE.internal && validation.validateUrl(url, t).validateStatus === 'error';
      if (isInvalidSourceUrl) {
        return unknownResult;
      }

      setIsDeterminingDuration(true);
      const completeUrl = getFullSourceUrl(url);
      const { sanitizedUrl, startTimecode, stopTimecode, resourceType } = analyzeMediaUrl(completeUrl);
      const duration = await determineMediaDuration(completeUrl);
      return { sanitizedUrl, duration, startTimecode, stopTimecode, resourceType };
    } catch (error) {
      return { ...unknownResult, error };
    } finally {
      setIsDeterminingDuration(false);
    }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleChapterStartTimecodeChange = (key, newStartTimecode) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startTimecode = newStartTimecode;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    setSelectedChapterIndex(0);
    changeContent({
      sourceType: value,
      sourceUrl: '',
      showVideo: false,
      sourceDuration: 0,
      sourceStartTimecode: null,
      sourceStopTimecode: null,
      copyrightNotice: '',
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
  };

  const handleSourceUrlChange = async value => {
    const { duration, resourceType, error } = await getMediaInformation(value);
    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    setSelectedChapterIndex(0);
    changeContent({
      sourceUrl: value,
      showVideo: resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown,
      sourceDuration: duration,
      sourceStartTimecode: null,
      sourceStopTimecode: null,
      copyrightNotice: newCopyrightNotice,
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handleSourceUrlBlur = () => {
    const { sanitizedUrl, startTimecode, stopTimecode } = analyzeMediaUrl(sourceUrl);
    setSelectedChapterIndex(0);
    changeContent({
      sourceUrl: sourceType !== MEDIA_SOURCE_TYPE.internal ? sanitizedUrl : sourceUrl,
      sourceStartTimecode: startTimecode,
      sourceStopTimecode: stopTimecode
    });
  };

  const handleMediaRangeChange = newRange => {
    const newChapters = trimChaptersToFitRange({
      chapters,
      duration: sourceDuration,
      range: newRange
    });

    setSelectedChapterIndex(oldIndex => Math.min(oldIndex, newChapters.length - 1));

    changeContent({
      sourceStartTimecode: newRange.startTimecode,
      sourceStopTimecode: newRange.stopTimecode,
      chapters: newChapters
    });
  };

  const handleInternalUrlFileNameChanged = async value => {
    await handleSourceUrlChange(value);
  };

  const handleAspectRatioChanged = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleShowVideoChanged = newShowVideo => {
    changeContent({ showVideo: newShowVideo });
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleChapterAdd = startTimecode => {
    const chapter = { ...interactiveMediaInfo.getDefaultChapter(t), startTimecode };
    const newChapters = ensureChaptersOrder([...chapters, chapter]);
    changeContent({ chapters: newChapters });
  };

  const handleChapterDelete = key => {
    const chapterIndex = chapters.findIndex(p => p.key === key);
    const nextChapter = chapters[chapterIndex + 1];
    if (nextChapter) {
      nextChapter.startTimecode = chapters[chapterIndex].startTimecode;
    }
    const newChapters = removeItemAt(chapters, chapterIndex);
    if (selectedChapterIndex > newChapters.length - 1) {
      setSelectedChapterIndex(newChapters.length - 1);
    }
    changeContent({ chapters: newChapters });
  };

  const handlePreviousChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex - 1);
  };

  const handleNextChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex + 1);
  };

  const handleChapterTitleChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], title: value };
    changeContent({ chapters: newChapters });
  };

  const handleChapterQuestionChange = event => {
    const { value } = event.target;
    const newChapters = cloneDeep(chapters);
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], question: value };
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
        disabled={!selectedChapterDuration}
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
          disabled={!selectedChapterDuration}
          onClick={() => handleChapterAnswerMarkClick(index)}
          />
      </Tooltip>
      <DeleteButton onClick={() => handleChapterAnswerDeleteClick(index)} />
    </div>
  );

  return (
    <div className="InteractiveMediaEditor">
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === MEDIA_SOURCE_TYPE.external && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <DebouncedInput value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div className="u-input-and-button">
              <DebouncedInput
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleSourceUrlChange}
                onBlur={handleSourceUrlBlur}
                />
              <ResourcePicker
                url={storageLocationPathToUrl(sourceUrl)}
                onUrlChange={url => handleInternalUrlFileNameChanged(urlToStorageLocationPath(url))}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <DebouncedInput value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
          </FormItem>
        )}
        <FormItem label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup
            size="small"
            defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
            value={aspectRatio}
            onChange={handleAspectRatioChanged}
            disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
            >
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
            />
        </FormItem>
        <FormItem label={t('playbackRange')} {...formItemLayout}>
          <div className="u-input-and-button">
            <Input
              value={t('playbackRangeInfo', {
                from: sourceStartTimecode ? formatMillisecondsAsDuration(sourceStartTimecode) : 'start',
                to: sourceStopTimecode ? formatMillisecondsAsDuration(sourceStopTimecode) : 'end'
              })}
              readOnly
              />
            <MediaRangeSelector
              sourceUrl={getFullSourceUrl(sourceUrl)}
              range={{ startTimecode: sourceStartTimecode, stopTimecode: sourceStopTimecode }}
              onRangeChange={handleMediaRangeChange}
              />
          </div>
        </FormItem>
        <FormItem label={t('common:width')} {...formItemLayout}>
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
        <FormItem label={t('common:copyrightNotice')} {...formItemLayout}>
          <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
        </FormItem>

        <Divider className="InteractiveMediaEditor-chapterEditorDivider" plain>{t('editChapter')}</Divider>

        <MediaPlayer
          source={getFullSourceUrl(sourceUrl)}
          screenMode={showVideo ? MEDIA_SCREEN_MODE.preview : MEDIA_SCREEN_MODE.none}
          />

        <Timeline
          length={playbackDuration}
          parts={chapters}
          selectedPartIndex={selectedChapterIndex}
          onPartAdd={handleChapterAdd}
          onPartDelete={handleChapterDelete}
          onStartTimecodeChange={handleChapterStartTimecodeChange}
          />

        {chapters.length && (
          <Fragment>
            <div className="InteractiveMediaEditor-chapterSelector">
              <Tooltip title={t('selectPreviousChapter')}>
                <Button
                  type="link"
                  size="small"
                  shape="circle"
                  icon={<LeftOutlined />}
                  onClick={handlePreviousChapterClick}
                  disabled={selectedChapterIndex === 0}
                  className="InteractiveMediaEditor-chapterSelectorArrow"
                  />
              </Tooltip>
              <span className="InteractiveMediaEditor-selectedChapterTitle">{chapters[selectedChapterIndex].title}</span>
              <Tooltip title={t('selectNextChapter')}>
                <Button
                  type="link"
                  size="small"
                  shape="circle"
                  icon={<RightOutlined />}
                  onClick={handleNextChapterClick}
                  disabled={selectedChapterIndex === chapters.length - 1}
                  className="InteractiveMediaEditor-chapterSelectorArrow"
                  />
              </Tooltip>
            </div>

            <FormItem label={t('startTimecode')} {...formItemLayout}>
              <span className="InteractiveMediaEditor-readonlyValue">
                {formatMillisecondsAsDuration(chapters[selectedChapterIndex].startTimecode)}
              </span>
            </FormItem>
            <FormItem label={t('duration')} {...formItemLayout}>
              <span className="InteractiveMediaEditor-readonlyValue">
                {formatMillisecondsAsDuration(selectedChapterDuration)}
              </span>
            </FormItem>
            <FormItem label={t('common:title')} {...formItemLayout}>
              <Input
                disabled={!selectedChapterDuration}
                onChange={handleChapterTitleChange}
                value={chapters[selectedChapterIndex].title}
                />
            </FormItem>
            <FormItem label={t('question')} {...formItemLayout}>
              <MarkdownInput
                preview
                disabled={!selectedChapterDuration}
                onChange={handleChapterQuestionChange}
                value={chapters?.[selectedChapterIndex].question || ''}
                />
            </FormItem>
            <FormItem {...tailFormItemLayout}>
              <div>{t('addAnswerInfo')}</div>
            </FormItem>
            <FormItem label={t('answers')} {...formItemLayout}>
              {(chapters?.[selectedChapterIndex].answers || []).map(renderAnswer)}
              <Tooltip title={t('addAnswer')}>
                <Button
                  shape="circle"
                  size="small"
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!selectedChapterDuration}
                  onClick={handleNewChapterAnswerClick}
                  />
              </Tooltip>
            </FormItem>
          </Fragment>
        )}
      </Form>

      {isDeterminingDuration && (
        <Fragment>
          <div className="InteractiveMediaEditor-overlay" />
          <Spin className="InteractiveMediaEditor-overlaySpinner" tip={t('determiningDuration')} size="large" />
        </Fragment>
      )}
    </div>
  );
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;

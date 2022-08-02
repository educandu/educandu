import by from 'thenby';
import classNames from 'classnames';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import cloneDeep from '../../utils/clone-deep.js';
import Timeline from '../../components/timeline.js';
import { handleError } from '../../ui/error-helper.js';
import { removeItemAt } from '../../utils/array-utils.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import DeleteButton from '../../components/delete-button.js';
import MarkdownInput from '../../components/markdown-input.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { getResourceType } from '../../utils/resource-utils.js';
import ResourcePicker from '../../components/resource-picker.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { useNumberFormat } from '../../components/locale-context.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MediaRangeSelector from '../../components/media-range-selector.js';
import { Button, Divider, Form, Input, Radio, Spin, Switch, Tooltip } from 'antd';
import { CheckOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { analyzeMediaUrl, determineMediaDuration, ensureValidMediaPosition, formatMediaPosition } from '../../utils/media-utils.js';
import { CDN_URL_PREFIX, MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE, RESOURCE_TYPE } from '../../domain/constants.js';

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

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startPosition));

function InteractiveMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { formatPercentage } = useNumberFormat();
  const { t } = useTranslation('interactiveMedia');
  const [sourceDuration, setSourceDuration] = useState(0);
  const interactiveMediaInfo = useService(InteractiveMediaInfo);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterFraction, setSelectedChapterFraction] = useState(0);
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, playbackRange, chapters, copyrightNotice, width, aspectRatio, showVideo } = content;

  const playbackDuration = (playbackRange[1] - playbackRange[0]) * sourceDuration;

  useEffect(() => {
    const nextChapterStartPosition = chapters[selectedChapterIndex + 1]?.startPosition || 1;
    setSelectedChapterFraction(nextChapterStartPosition - chapters[selectedChapterIndex].startPosition);
  }, [chapters, selectedChapterIndex, playbackDuration]);

  const getFullSourceUrl = url => url && sourceType === MEDIA_SOURCE_TYPE.internal
    ? `${clientConfig.cdnRootUrl}/${url}`
    : url || null;

  const getMediaInformation = async url => {
    const defaultResult = {
      sanitizedUrl: url,
      duration: 0,
      range: [0, 1],
      resourceType: RESOURCE_TYPE.unknown,
      error: null
    };

    if (!url) {
      return defaultResult;
    }

    try {
      const isInvalidSourceUrl = sourceType !== MEDIA_SOURCE_TYPE.internal && validation.validateUrl(url, t).validateStatus === 'error';
      if (isInvalidSourceUrl) {
        return defaultResult;
      }

      setIsDeterminingDuration(true);
      const completeUrl = getFullSourceUrl(url);
      const { sanitizedUrl, startTimecode, stopTimecode, resourceType } = analyzeMediaUrl(completeUrl);
      const duration = await determineMediaDuration(completeUrl);
      const range = [
        startTimecode ? ensureValidMediaPosition(startTimecode / duration) : playbackRange[0],
        stopTimecode ? ensureValidMediaPosition(stopTimecode / duration) : playbackRange[1]
      ];
      return { ...defaultResult, sanitizedUrl, duration, range, resourceType };
    } catch (error) {
      return { ...defaultResult, error };
    } finally {
      setIsDeterminingDuration(false);
    }
  };

  useOnComponentMounted(async () => {
    const { duration } = await getMediaInformation(sourceUrl);
    setSourceDuration(duration);
  });

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleChapterStartPositionChange = (key, newStartPosition) => {
    const chapter = chapters.find(p => p.key === key);
    chapter.startPosition = newStartPosition;
    const newChapters = [...chapters];
    changeContent({ chapters: newChapters });
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    setSelectedChapterIndex(0);
    changeContent({
      sourceType: value,
      sourceUrl: '',
      range: [0, 1],
      showVideo: false,
      copyrightNotice: ''
    });
  };

  const handleSourceUrlChangeComplete = async value => {
    const { sanitizedUrl, duration, range, resourceType, error } = await getMediaInformation(value);
    setSourceDuration(duration);

    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    changeContent({
      sourceUrl: sourceType !== MEDIA_SOURCE_TYPE.internal ? sanitizedUrl : value,
      showVideo: resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown,
      playbackRange: range,
      copyrightNotice: newCopyrightNotice
    });

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handleSourceUrlChange = event => {
    changeContent({ sourceUrl: event.target.value });
  };

  const handleSourceUrlBlur = event => {
    handleSourceUrlChangeComplete(event.target.value);
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
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

  const renderPlaybackRangeInfo = () => {
    const from = playbackRange[0] !== 0
      ? formatMediaPosition({ formatPercentage, position: playbackRange[0], duration: sourceDuration })
      : 'start';

    const to = playbackRange[1] !== 1
      ? formatMediaPosition({ formatPercentage, position: playbackRange[1], duration: sourceDuration })
      : 'end';

    return t('playbackRangeInfo', { from, to });
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
            <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div className="u-input-and-button">
              <Input
                addonBefore={CDN_URL_PREFIX}
                value={sourceUrl}
                onChange={handleSourceUrlChange}
                onBlur={handleSourceUrlBlur}
                />
              <ResourcePicker
                url={storageLocationPathToUrl(sourceUrl)}
                onUrlChange={url => handleSourceUrlChangeComplete(urlToStorageLocationPath(url))}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
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
            <Input value={renderPlaybackRangeInfo()} readOnly />
            <MediaRangeSelector
              sourceUrl={getFullSourceUrl(sourceUrl)}
              range={playbackRange}
              onRangeChange={handlePlaybackRangeChange}
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
          durationInMilliseconds={playbackDuration}
          parts={chapters}
          selectedPartIndex={selectedChapterIndex}
          onPartAdd={handleChapterAdd}
          onPartDelete={handleChapterDelete}
          onStartPositionChange={handleChapterStartPositionChange}
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
                {formatMediaPosition({ formatPercentage, position: chapters[selectedChapterIndex].startPosition, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('duration')} {...formItemLayout}>
              <span className="InteractiveMediaEditor-readonlyValue">
                {formatMediaPosition({ formatPercentage, position: selectedChapterFraction, duration: playbackDuration })}
              </span>
            </FormItem>
            <FormItem label={t('common:title')} {...formItemLayout}>
              <Input
                disabled={!selectedChapterFraction}
                onChange={handleChapterTitleChange}
                value={chapters[selectedChapterIndex].title}
                />
            </FormItem>
            <FormItem label={t('common:text')} {...formItemLayout}>
              <MarkdownInput
                preview
                disabled={!selectedChapterFraction}
                onChange={handleChapterTextChange}
                value={chapters?.[selectedChapterIndex].text || ''}
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
                  disabled={!selectedChapterFraction}
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

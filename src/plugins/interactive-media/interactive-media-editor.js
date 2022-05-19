import by from 'thenby';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import validation from '../../ui/validation.js';
import Timeline from '../../components/timeline.js';
import { handleError } from '../../ui/error-helper.js';
import { removeItemAt } from '../../utils/array-utils.js';
import MediaPlayer from '../../components/media-player.js';
import ClientConfig from '../../bootstrap/client-config.js';
import React, { Fragment, useEffect, useState } from 'react';
import InteractiveMediaInfo from './interactive-media-info.js';
import { getResourceType } from '../../utils/resource-utils.js';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import DebouncedInput from '../../components/debounced-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import { Button, Form, Input, Radio, Spin, Switch, Tooltip } from 'antd';
import MediaRangeSelector from '../../components/media-range-selector.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE, RESOURCE_TYPE } from '../../domain/constants.js';
import { trimChaptersToFitRange, analyzeMediaUrl, determineMediaDuration, formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const TextArea = Input.TextArea;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function InteractiveMediaEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');
  const interactiveMediaInfo = useService(InteractiveMediaInfo);

  const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startTimecode));

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterDuration, setSelectedChapterDuration] = useState(0);
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, sourceDuration, sourceStartTimecode, sourceStopTimecode, chapters, text, width, aspectRatio, showVideo } = content;

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

  const handleChapterAdd = startTimecode => {
    const chapter = { key: uniqueId.create(), title: t('defaultChapterTitle'), startTimecode };
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
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
  };

  const handleSourceUrlChange = async value => {
    const { duration, resourceType, error } = await getMediaInformation(value);
    setSelectedChapterIndex(0);
    changeContent({
      sourceUrl: value,
      showVideo: resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown,
      sourceDuration: duration,
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

  const handleCopyrightInfoChanged = event => {
    changeContent({ text: event.target.value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handlePreviousChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex - 1);
  };

  const handleNextChapterClick = () => {
    setSelectedChapterIndex(selectedChapterIndex + 1);
  };

  const handleChapterTitleChange = event => {
    const { value } = event.target;
    const newChapters = [...chapters];
    newChapters[selectedChapterIndex] = { ...newChapters[selectedChapterIndex], title: value };
    changeContent({ chapters: newChapters });
  };

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
              <DebouncedInput addonBefore={`${clientConfig.cdnRootUrl}/`} value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
              <StorageFilePicker
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChanged}
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
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </FormItem>
        <FormItem label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoChanged} autoSize={{ minRows: 3 }} />
        </FormItem>

        <hr className="InteractiveMediaEditor-separator" />

        <h6 className="InteractiveMediaEditor-chapterEditorTitle">{t('editChapter')}</h6>

        <MediaPlayer sourceUrl={getFullSourceUrl(sourceUrl)} audioOnly={showVideo === false} previewMode />

        <Timeline
          length={sourceDuration}
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
              <Input value={chapters[selectedChapterIndex].title} onChange={handleChapterTitleChange} />
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

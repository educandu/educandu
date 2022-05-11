import by from 'thenby';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import validation from '../../ui/validation.js';
import Timeline from '../../components/timeline.js';
import { getMediaType } from '../../utils/media-utils.js';
import { removeItemAt } from '../../utils/array-utils.js';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import DebouncedInput from '../../components/debounced-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import { Button, Form, Input, Radio, Spin, Switch, Tooltip } from 'antd';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE, MEDIA_TYPE } from '../../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

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
  const hiddenPlayerContainerRef = useRef(null);
  const { t } = useTranslation('interactiveMedia');
  const interactiveMediaInfo = useService(InteractiveMediaInfo);

  const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startTimecode));

  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, sourceDuration, chapters, text, width, aspectRatio, showVideo } = content;

  function determineMediaDuration(url, containerRef) {
    return new Promise((resolve, reject) => {
      try {
        const element = React.createElement(ReactPlayer, {
          url,
          light: false,
          playing: false,
          onDuration: durationInSeconds => {
            const durationInMiliseconds = durationInSeconds * 1000;
            resolve(durationInMiliseconds);
            ReactDOM.unmountComponentAtNode(containerRef.current);
          },
          onError: error => {
            reject(error);
            ReactDOM.unmountComponentAtNode(containerRef.current);
          }
        });
        ReactDOM.render(element, containerRef.current);
      } catch (error) {
        reject(error);
      }
    });
  }

  const determineSourceDuration = async url => {
    if (!url) {
      return 0;
    }

    const completeUrl = sourceType === MEDIA_SOURCE_TYPE.internal ? `${clientConfig.cdnRootUrl}/${url}` : url;
    const isInvalidSourceUrl = sourceType !== MEDIA_SOURCE_TYPE.internal && validation.validateUrl(url, t).validateStatus === 'error';

    if (isInvalidSourceUrl) {
      return 0;
    }

    try {
      setIsDeterminingDuration(true);
      const duration = await determineMediaDuration(completeUrl, hiddenPlayerContainerRef);
      return duration;
    } catch (error) {
      return 0;
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
    changeContent({ chapters: newChapters });
  };

  const handleStartTimecodeChange = (key, newStartTimecode) => {
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
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
  };

  const handleSourceUrlChange = async value => {
    const newSourceDuration = await determineSourceDuration(value);
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    setSelectedChapterIndex(0);
    changeContent({
      sourceUrl: value,
      showVideo: newShowVideo,
      sourceDuration: newSourceDuration,
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
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
            <DebouncedInput value={sourceUrl} onChange={handleSourceUrlChange} />
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <DebouncedInput addonBefore={`${clientConfig.cdnRootUrl}/`} value={sourceUrl} onChange={handleSourceUrlChange} />
              <StorageFilePicker
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <DebouncedInput value={sourceUrl} onChange={handleSourceUrlChange} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup
            size="small"
            defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
            value={aspectRatio}
            onChange={handleAspectRatioChanged}
            disabled={![MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(sourceUrl))}
            >
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={![MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(sourceUrl))}
            />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>

        <div className="InteractiveMediaEditor-timeline">
          <Timeline
            length={sourceDuration}
            parts={chapters}
            selectedPartIndex={selectedChapterIndex}
            onPartAdd={handleChapterAdd}
            onPartDelete={handleChapterDelete}
            onStartTimecodeChange={handleStartTimecodeChange}
            />
        </div>

        {chapters.length && (
          <Fragment>
            <div className="InteractiveMediaEditor-chapterSelector">
              <Tooltip title={t('selectPreviousChapter')}>
                <Button
                  type="link"
                  icon={<LeftOutlined />}
                  onClick={handlePreviousChapterClick}
                  disabled={selectedChapterIndex === 0}
                  />
              </Tooltip>
              <span className="InteractiveMediaEditor-selectedChapterTitle">{chapters[selectedChapterIndex].title}</span>
              <Tooltip title={t('selectNextChapter')}>
                <Button
                  type="link"
                  icon={<RightOutlined />}
                  onClick={handleNextChapterClick}
                  disabled={selectedChapterIndex === chapters.length - 1}
                  />
              </Tooltip>
            </div>
            <div className="Panel">
              <div className="Panel-header">{t('editChapter')}</div>
              <div className="Panel-content">
                <FormItem label={t('common:title')} {...formItemLayout}>
                  <Input value={chapters[selectedChapterIndex].title} onChange={handleChapterTitleChange} />
                </FormItem>
              </div>
            </div>
          </Fragment>
        )}
      </Form>

      {isDeterminingDuration && (
        <Fragment>
          <div className="InteractiveMediaEditor-overlay" />
          <Spin className="InteractiveMediaEditor-overlaySpinner" tip={t('determiningDuration')} size="large" />
        </Fragment>
      )}
      <div ref={hiddenPlayerContainerRef} className="InteractiveMediaEditor-hiddenPlayerContainer" />
    </div>
  );
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;

import by from 'thenby';
import ReactDOM from 'react-dom';
import reactPlayerNs from 'react-player';
import { useTranslation } from 'react-i18next';
import uniqueId from '../../utils/unique-id.js';
import validation from '../../ui/validation.js';
import Timeline from '../../components/timeline.js';
import { Form, Input, Radio, Spin, Switch } from 'antd';
import { MEDIA_TYPE, SOURCE_TYPE } from './constants.js';
import { removeItemAt } from '../../utils/array-utils.js';
import React, { Fragment, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import InteractiveMediaInfo from './interactive-media-info.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const TextArea = Input.TextArea;
const RadioButton = Radio.Button;

const videoTypes = ['mp4', 'mov', 'avi', 'mkv'];
const audioTypes = ['mp3', 'flac', 'aac', 'wav'];
const supportedAspectRatios = [{ h: 16, v: 9 }, { h: 4, v: 3 }];

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function InteractiveMediaEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const clientConfig = useService(ClientConfig);
  const hiddenPlayerContainerRef = useRef(null);
  const { t } = useTranslation('interactiveMedia');
  const interactiveMediaInfo = useService(InteractiveMediaInfo);

  const getAspectRatioText = givenAspectRatio => `${givenAspectRatio.h}:${givenAspectRatio.v}`;
  const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startTimecode));

  const defaultAspectRatio = supportedAspectRatios[0];
  const [isDeterminingDuration, setIsDeterminingDuration] = useState(false);
  const { sourceType, sourceUrl, sourceDuration, chapters, text, width, aspectRatio, showVideo } = content;

  const getMediaType = path => {
    const sanitizedPath = (path || '').trim();
    const extensionMatches = sanitizedPath.match(/\.([0-9a-z]+)$/i);
    const extension = extensionMatches && extensionMatches[1];

    if (!extension) {
      return MEDIA_TYPE.none;
    }
    if (audioTypes.includes(extension)) {
      return MEDIA_TYPE.audio;
    }
    if (videoTypes.includes(extension)) {
      return MEDIA_TYPE.video;
    }
    return MEDIA_TYPE.unknown;
  };

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

    const completeUrl = sourceType === SOURCE_TYPE.internal ? `${clientConfig.cdnRootUrl}/${url}` : url;
    const isInvalidSourceUrl = sourceType !== SOURCE_TYPE.internal && validation.validateUrl(url, t).validateStatus === 'error';

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
      = newContent.sourceType !== SOURCE_TYPE.internal
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
    changeContent({
      sourceType: value,
      sourceUrl: '',
      showVideo: false,
      aspectRatio: defaultAspectRatio,
      sourceDuration: 0,
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
  };

  const handleSourceUrlChange = async value => {
    const newSourceDuration = await determineSourceDuration(value);
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    changeContent({
      sourceUrl: value,
      showVideo: newShowVideo,
      aspectRatio: defaultAspectRatio,
      sourceDuration: newSourceDuration,
      chapters: [interactiveMediaInfo.getDefaultChapter(t)]
    });
  };

  const handleExternalUrlChange = async event => {
    const { value } = event.target;
    await handleSourceUrlChange(value);
  };

  const handleInternalUrlChanged = async event => {
    const { value } = event.target;
    await handleSourceUrlChange(value);
  };

  const handleYoutubeUrlChanged = async event => {
    const { value } = event.target;
    await handleSourceUrlChange(value);
  };

  const handleInternalUrlFileNameChanged = async value => {
    await handleSourceUrlChange(value);
  };

  const handleAspectRatioChanged = event => {
    const [h, v] = event.target.value.split(':').map(Number);
    changeContent({ aspectRatio: { h, v } });
  };

  const handleShowVideoChanged = newShowVideo => {
    changeContent({ showVideo: newShowVideo });
  };

  const handleCopyrightInfoChanged = event => {
    const { value } = event.target;
    changeContent({ text: value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  return (
    <div className="InteractiveMediaEditor">
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
            <RadioButton value={SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('common:internalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === SOURCE_TYPE.external && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleExternalUrlChange} />
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.internal && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleInternalUrlChanged}
                />
              <StorageFilePicker
                publicStorage={publicStorage}
                privateStorage={privateStorage}
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleYoutubeUrlChanged} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup
            size="small"
            defaultValue={getAspectRatioText(defaultAspectRatio)}
            value={`${aspectRatio.h}:${aspectRatio.v}`}
            onChange={handleAspectRatioChanged}
            disabled={[MEDIA_TYPE.audio, MEDIA_TYPE.unknown].includes(getMediaType(sourceUrl))}
            >
            {supportedAspectRatios.map(ratio => (
              <RadioButton key={getAspectRatioText(ratio)} value={getAspectRatioText(ratio)}>{getAspectRatioText(ratio)}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={[MEDIA_TYPE.audio, MEDIA_TYPE.unknown].includes(getMediaType(sourceUrl))}
            />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>

      <Timeline
        length={sourceDuration}
        parts={chapters}
        onPartAdd={handleChapterAdd}
        onPartDelete={handleChapterDelete}
        onStartTimecodeChange={handleStartTimecodeChange}
        />
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

import by from 'thenby';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Radio, Switch } from 'antd';
import Timeline from '../../components/timeline.js';
import { MEDIA_TYPE, SOURCE_TYPE } from './constants.js';
import { removeItemAt } from '../../utils/array-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const TextArea = Input.TextArea;
const RadioButton = Radio.Button;

const videoTypes = ['mp4', 'mov', 'avi', 'mkv'];
const audioTypes = ['mp3', 'flac', 'aac', 'wav'];

const ensureChaptersOrder = chapters => chapters.sort(by(chapter => chapter.startTimecode));
const getAspectRatioText = aspectRatio => `${aspectRatio.h}:${aspectRatio.v}`;

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

function InteractiveMediaEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('interactiveMedia');

  const { sourceType, sourceUrl, sourceDuration, text, width, aspectRatio, showVideo } = content;

  const supportedAspectRatios = [{ h: 16, v: 9 }, { h: 4, v: 3 }];
  const defaultAspectRatio = supportedAspectRatios[0];

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const [chapters, setChapters] = useState(ensureChaptersOrder(content.chapters));

  const handleChapterAdd = startTimecode => {
    const newChapter = {
      key: chapters.length.toString(),
      title: chapters.length.toString(),
      startTimecode
    };
    setChapters(ensureChaptersOrder([...chapters, newChapter]));
  };

  const handleChapterDelete = key => {
    const part = chapters.find(p => p.key === key);
    const partIndex = chapters.findIndex(p => p.key === key);
    const nextPart = chapters[partIndex + 1];
    if (nextPart) {
      nextPart.startTimecode = part.startTimecode;
    }
    const newChapters = removeItemAt(chapters, partIndex);
    setChapters(newChapters);
  };

  const handleStartTimecodeChange = (key, newStartTimecode) => {
    const part = chapters.find(p => p.key === key);
    part.startTimecode = newStartTimecode;
    setChapters(chapters.slice());
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '', showVideo: false, aspectRatio: defaultAspectRatio });
  };

  const handleExternalUrlChange = event => {
    const { value } = event.target;
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    changeContent({ sourceUrl: value, showVideo: newShowVideo, aspectRatio: defaultAspectRatio });
  };

  const handleInternalUrlChanged = event => {
    const { value } = event.target;
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    changeContent({ sourceUrl: value, showVideo: newShowVideo, aspectRatio: defaultAspectRatio });
  };

  const handleYoutubeUrlChanged = event => {
    const { value } = event.target;
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    changeContent({ sourceUrl: value, showVideo: newShowVideo, aspectRatio: defaultAspectRatio });
  };

  const handleInternalUrlFileNameChanged = value => {
    const newShowVideo = [MEDIA_TYPE.video, MEDIA_TYPE.none].includes(getMediaType(value));
    changeContent({ sourceUrl: value, showVideo: newShowVideo, aspectRatio: defaultAspectRatio });
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
    </div>
  );
}

InteractiveMediaEditor.propTypes = {
  ...sectionEditorProps
};

export default InteractiveMediaEditor;

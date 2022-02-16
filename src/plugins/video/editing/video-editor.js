import React from 'react';
import { SOURCE_TYPE } from '../constants.js';
import { useTranslation } from 'react-i18next';
import { Form, Input, Radio, Switch } from 'antd';
import validation from '../../../ui/validation.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { useService } from '../../../components/container-context.js';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

function VideoEditor({ content, onContentChanged, publicStorage }) {
  const { t } = useTranslation('video');
  const clientConfig = useService(ClientConfig);

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const { type, url, text, width, aspectRatio, showVideo } = content;

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleExternalUrlChanged = event => {
    const { value } = event.target;
    changeContent({ url: value });
  };

  const handleYoutubeUrlChanged = event => {
    const { value } = event.target;
    changeContent({ url: value });
  };

  const handleInternalUrlChanged = event => {
    const { value } = event.target;
    changeContent({ url: value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeContent({ url: value });
  };

  const handleTypeChanged = event => {
    const { value } = event.target;
    changeContent({ type: value, url: '', showVideo: true });
  };

  const handleAspectRatioChanged = event => {
    const [h, v] = event.target.value.split(':').map(Number);
    changeContent({ aspectRatio: { h, v } });
  };

  const handleShowVideoChanged = newDhowVideo => {
    changeContent({ showVideo: newDhowVideo });
  };

  const handleCopyrightInfoChanged = event => {
    const { value } = event.target;
    changeContent({ text: value });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('source')} {...formItemLayout}>
          <RadioGroup value={type} onChange={handleTypeChanged}>
            <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('internalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.youtube}>{t('youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {type === SOURCE_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
            <Input value={url} onChange={handleExternalUrlChanged} />
          </FormItem>
        )}
        {type === SOURCE_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={url}
                onChange={handleInternalUrlChanged}
                />
              <CdnFilePicker
                publicStorage={publicStorage}
                fileName={url}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        {type === SOURCE_TYPE.youtube && (
          <FormItem label={t('youtubeUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
            <Input value={url} onChange={handleYoutubeUrlChanged} />
          </FormItem>
        )}
        <Form.Item label={t('aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={handleAspectRatioChanged}>
            <RadioButton value="16:9">16:9</RadioButton>
            <RadioButton value="4:3">4:3</RadioButton>
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('videoDisplay')} {...formItemLayout}>
          <Switch size="small" defaultChecked checked={showVideo} onChange={handleShowVideoChanged} />
        </Form.Item>
        <Form.Item label={t('width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

VideoEditor.propTypes = {
  ...sectionEditorProps
};

export default VideoEditor;

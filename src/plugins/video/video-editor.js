import React, { Fragment } from 'react';
import { SOURCE_TYPE } from './constants.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Radio, Switch } from 'antd';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

function VideoEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('video');
  const clientConfig = useService(ClientConfig);

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const { sourceType, sourceUrl, text, width, aspectRatio, showVideo, posterImage } = content;

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleExternalUrlChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleYoutubeUrlChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value });
  };

  const handleTypeChanged = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      showVideo: true,
      posterImage: {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: ''
      }
    });
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

  const handlePosterImageSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ posterImage: { sourceType: SOURCE_TYPE.internal, sourceUrl: value } });
  };

  const handlePosterImageSourceUrlFileNameChanged = value => {
    changeContent({ posterImage: { sourceType: SOURCE_TYPE.internal, sourceUrl: value } });
  };

  const renderPosterImageFormItem = () => (
    <FormItem label={t('posterImageUrl')} {...formItemLayout}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Input
          addonBefore={`${clientConfig.cdnRootUrl}/`}
          value={posterImage.sourceUrl}
          onChange={handlePosterImageSourceUrlValueChanged}
          />
        <StorageFilePicker
          publicStorage={publicStorage}
          privateStorage={privateStorage}
          fileName={posterImage.sourceUrl}
          onFileNameChanged={handlePosterImageSourceUrlFileNameChanged}
          />
      </div>
    </FormItem>
  );

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleTypeChanged}>
            <RadioButton value={SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('internalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === SOURCE_TYPE.external && (
          <Fragment>
            <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
              <Input value={sourceUrl} onChange={handleExternalUrlChanged} />
            </FormItem>
            {renderPosterImageFormItem()}
          </Fragment>
        )}
        {sourceType === SOURCE_TYPE.internal && (
          <Fragment>
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
            {renderPosterImageFormItem()}
          </Fragment>
        )}
        {sourceType === SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleYoutubeUrlChanged} />
          </FormItem>
        )}
        <Form.Item label={t('common:aspectRatio')} {...formItemLayout}>
          <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={handleAspectRatioChanged}>
            <RadioButton value="16:9">16:9</RadioButton>
            <RadioButton value="4:3">4:3</RadioButton>
          </RadioGroup>
        </Form.Item>
        <Form.Item label={t('common:videoDisplay')} {...formItemLayout}>
          <Switch size="small" defaultChecked checked={showVideo} onChange={handleShowVideoChanged} />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
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

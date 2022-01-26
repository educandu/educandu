import React from 'react';
import autoBind from 'auto-bind';
import { SOURCE_TYPE } from '../constants.js';
import { withTranslation } from 'react-i18next';
import { Form, Input, Radio, Switch } from 'antd';
import validation from '../../../ui/validation.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

class VideoEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleExternalUrlChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleYoutubeUrlChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleInternalUrlChanged(e) {
    this.changeContent({ url: e.target.value });
  }

  handleInternalUrlFileNameChanged(value) {
    this.changeContent({ url: value });
  }

  handleTypeChanged(event) {
    const { value } = event.target;
    this.changeContent({ type: value, url: '', showVideo: true });
  }

  handleAspectRatioChanged(event) {
    const [h, v] = event.target.value.split(':').map(Number);
    this.changeContent({ aspectRatio: { h, v } });
  }

  handleShowVideoChanged(showVideo) {
    this.changeContent({ showVideo });
  }

  handleCopyrightInfoChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleWidthChanged(newValue) {
    this.changeContent({ width: newValue });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { sectionContainerId, content, clientConfig, t } = this.props;
    const { type, url, text, width, aspectRatio, showVideo } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('source')} {...formItemLayout}>
            <RadioGroup value={type} onChange={this.handleTypeChanged}>
              <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
              <RadioButton value={SOURCE_TYPE.internal}>{t('internalLink')}</RadioButton>
              <RadioButton value={SOURCE_TYPE.youtube}>{t('youtube')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === SOURCE_TYPE.external && (
            <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
              <Input value={url} onChange={this.handleExternalUrlChanged} />
            </FormItem>
          )}
          {type === SOURCE_TYPE.internal && (
            <FormItem label={t('internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={url}
                  onChange={this.handleInternalUrlChanged}
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${sectionContainerId}`}
                  initialPrefix={`media/${sectionContainerId}`}
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlFileNameChanged}
                  />
              </div>
            </FormItem>
          )}
          {type === SOURCE_TYPE.youtube && (
            <FormItem label={t('youtubeUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
              <Input value={url} onChange={this.handleYoutubeUrlChanged} />
            </FormItem>
          )}
          <Form.Item label={t('aspectRatio')} {...formItemLayout}>
            <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={this.handleAspectRatioChanged}>
              <RadioButton value="16:9">16:9</RadioButton>
              <RadioButton value="4:3">4:3</RadioButton>
            </RadioGroup>
          </Form.Item>
          <Form.Item label={t('videoDisplay')} {...formItemLayout}>
            <Switch size="small" defaultChecked checked={showVideo} onChange={this.handleShowVideoChanged} />
          </Form.Item>
          <Form.Item label={t('width')} {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={this.handleWidthChanged} />
          </Form.Item>
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCopyrightInfoChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

VideoEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  ...clientConfigProps
};

export default withTranslation('video')(inject({
  clientConfig: ClientConfig
}, VideoEditor));

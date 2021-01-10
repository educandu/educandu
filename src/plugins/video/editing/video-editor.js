import React from 'react';
import autoBind from 'auto-bind';
import validation from '../../../ui/validation';
import { withTranslation } from 'react-i18next';
import { Form, Input, Radio, Switch } from 'antd';
import { inject } from '../../../components/container-context';
import CdnFilePicker from '../../../components/cdn-file-picker';
import ClientConfig from '../../../bootstrap/client-config';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider';
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

const TYPE_EXTERNAL = 'external';
const TYPE_INTERNAL = 'internal';
const TYPE_YOUTUBE = 'youtube';

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

  handleInternalUrlChanged(value) {
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
    const { docKey, content, clientConfig, t } = this.props;
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
              <RadioButton value="external">{t('externalLink')}</RadioButton>
              <RadioButton value="internal">{t('internalLink')}</RadioButton>
              <RadioButton value="youtube">{t('youtube')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === TYPE_EXTERNAL && (
            <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
              <Input value={url} onChange={this.handleExternalUrlChanged} />
            </FormItem>
          )}
          {type === TYPE_INTERNAL && (
            <FormItem label={t('internalUrl')} {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientConfig.cdnRootUrl}/`}
                  value={url}
                  readOnly
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${docKey}`}
                  initialPrefix={`media/${docKey}`}
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlChanged}
                  />
              </div>
            </FormItem>
          )}
          {type === TYPE_YOUTUBE && (
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

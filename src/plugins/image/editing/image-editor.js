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

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

class ImageEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleHoverExternalUrlValueChanged(event) {
    const { value } = event.target;
    const hover = { ...this.props.content.hover };
    hover.url = value;
    this.changeContent({ hover });
  }

  handleInternalUrlValueChanged(value) {
    this.changeContent({ url: value });
  }

  handleHoverInternalUrlValueChanged(value) {
    const hover = { ...this.props.content.hover };
    hover.url = value;
    this.changeContent({ hover });
  }

  handleTypeValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ type: value, url: '' });
  }

  handleHoverTypeValueChanged(event) {
    const { value } = event.target;
    const hover = { ...this.props.content.hover };
    hover.type = value;
    hover.url = '';
    this.changeContent({ hover });
  }

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleCopyrightInfoValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleHoverCopyrightInfoValueChanged(event) {
    const newValue = event.target.value;
    const hover = { ...this.props.content.hover };
    hover.text = newValue;
    this.changeContent({ hover });
  }

  handleHoverSwitchChange(checked) {
    if (checked) {
      this.changeContent({ hover: { type: 'internal', url: '', text: '' } });
    } else {
      this.changeContent({ hover: null });
    }
  }

  render() {
    const { docKey, content, clientConfig, t } = this.props;
    const { type, url, maxWidth, text, hover } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label={t('source')} {...formItemLayout}>
            <RadioGroup value={type} onChange={this.handleTypeValueChanged}>
              <RadioButton value="external">{t('externalLink')}</RadioButton>
              <RadioButton value="internal">{t('internalLink')}</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === 'external' && (
            <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
              <Input value={url} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {type === 'internal' && (
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
                  onFileNameChanged={this.handleInternalUrlValueChanged}
                  />
              </div>
            </FormItem>
          )}
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label={t('hoverImage')} {...formItemLayout}>
            <Switch checked={!!hover} onChange={this.handleHoverSwitchChange} />
          </Form.Item>
          {hover && (
            <div className="Panel">
              <div className="Panel-content Panel-content--darker">
                <FormItem label={t('source')} {...formItemLayout}>
                  <RadioGroup value={hover.type} onChange={this.handleHoverTypeValueChanged}>
                    <RadioButton value="external">{t('externalLink')}</RadioButton>
                    <RadioButton value="internal">{t('internalLink')}</RadioButton>
                  </RadioGroup>
                </FormItem>
                {hover.type === 'external' && (
                  <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
                    <Input value={hover.url} onChange={this.handleHoverExternalUrlValueChanged} />
                  </FormItem>
                )}
                {hover.type === 'internal' && (
                  <FormItem label={t('internalUrl')} {...formItemLayout}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Input
                        addonBefore={`${clientConfig.cdnRootUrl}/`}
                        value={hover.url}
                        readOnly
                        />
                      <CdnFilePicker
                        rootPrefix="media"
                        uploadPrefix={`media/${docKey}`}
                        initialPrefix={`media/${docKey}`}
                        fileName={hover.url}
                        onFileNameChanged={this.handleHoverInternalUrlValueChanged}
                        />
                    </div>
                  </FormItem>
                )}
                <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
                  <TextArea value={hover.text} onChange={this.handleHoverCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
                </Form.Item>
              </div>
            </div>
          )}
          <Form.Item label={t('maximumWidth')} {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

ImageEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  ...clientConfigProps
};

export default withTranslation('image')(inject({
  clientConfig: ClientConfig
}, ImageEditor));


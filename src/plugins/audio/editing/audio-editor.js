import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input, Radio } from 'antd';
import { withTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { sectionEditorProps, clientConfigProps, translationProps } from '../../../ui/default-prop-types.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const { TextArea } = Input;

class AudioEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleInternalUrlValueChanged(e) {
    this.changeContent({ url: e.target.value });
  }

  handleInternalUrlFileNameChanged(value) {
    this.changeContent({ url: value });
  }

  handleTypeValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ type: value, url: '' });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  render() {
    const { docKey, content, clientConfig, t } = this.props;
    const { type, url, text } = content;

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
              <RadioButton value="internal">{t('elmuCdn')}</RadioButton>
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
                  onChange={this.handleInternalUrlValueChanged}
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  uploadPrefix={`media/${docKey}`}
                  initialPrefix={`media/${docKey}`}
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlFileNameChanged}
                  />
              </div>
            </FormItem>
          )}
          <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AudioEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps,
  ...clientConfigProps
};

export default withTranslation('audio')(inject({
  clientConfig: ClientConfig
}, AudioEditor));

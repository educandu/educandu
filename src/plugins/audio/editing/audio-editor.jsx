const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Radio = require('antd/lib/radio');
const validation = require('../../../ui/validation');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const { sectionEditorProps, clientSettingsProps } = require('../../../ui/default-prop-types');

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const { TextArea } = Input;

class AudioEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleInternalUrlValueChanged(value) {
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
    const { docKey, content, clientSettings } = this.props;
    const { type, url, text } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Quelle" {...formItemLayout}>
            <RadioGroup value={type} onChange={this.handleTypeValueChanged}>
              <RadioButton value="external">Externer Link</RadioButton>
              <RadioButton value="internal">Elmu CDN</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === 'external' && (
            <FormItem label="Externe URL" {...formItemLayout} {...validation.validateUrl(url)} hasFeedback>
              <Input value={url} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {type === 'internal' && (
            <FormItem label="Interne URL" {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientSettings.cdnRootUrl}/`}
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
          <Form.Item label="Copyright Infos" {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autosize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AudioEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, AudioEditor);

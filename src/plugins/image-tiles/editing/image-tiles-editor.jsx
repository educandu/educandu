const React = require('react');
const { Switch } = require('antd');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Radio = require('antd/lib/radio');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');
const { sectionEditorProps, clientSettingsProps } = require('../../../ui/default-prop-types');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

class ImageTilesEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleHoverExternalUrlValueChanged(event) {
    const { value } = event.target;
    const hover = this.props.content.hover || {};
    hover.url = value;
    this.changeContent({ hover });
  }

  handleInternalUrlValueChanged(value) {
    this.changeContent({ url: value });
  }

  handleHoverInternalUrlValueChanged(value) {
    const hover = this.props.content.hover || {};
    hover.url = value;
    this.changeContent({ hover });
  }

  handleTypeValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ type: value, url: '' });
  }

  handleHoverTypeValueChanged(event) {
    const { value } = event.target;
    const hover = this.props.content.hover || {};
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

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleCurrentHoverEditorValueChanged(event) {
    const newValue = event.target.value;
    const hover = this.props.content.hover || {};
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
    const { docKey, content, clientSettings } = this.props;
    const { type, url, maxWidth, text, hover } = content;

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
            <FormItem label="Externe URL" {...formItemLayout}>
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
          <Form.Item label="Hoverbild" {...formItemLayout}>
            <Switch checked={!!hover} onChange={this.handleHoverSwitchChange} />
          </Form.Item>
          {hover && (
            <div className="Panel">
              <div className="Panel-content Panel-content--darker">
                <FormItem label="Quelle" {...formItemLayout}>
                  <RadioGroup value={hover.type} onChange={this.handleHoverTypeValueChanged}>
                    <RadioButton value="external">Externer Link</RadioButton>
                    <RadioButton value="internal">Elmu CDN</RadioButton>
                  </RadioGroup>
                </FormItem>
                {hover.type === 'external' && (
                  <FormItem label="Externe URL" {...formItemLayout}>
                    <Input value={hover.url} onChange={this.handleHoverExternalUrlValueChanged} />
                  </FormItem>
                )}
                {hover.type === 'internal' && (
                  <FormItem label="Interne URL" {...formItemLayout}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Input
                        addonBefore={`${clientSettings.cdnRootUrl}/`}
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
                <Form.Item label="Copyright Infos" {...formItemLayout}>
                  <TextArea value={hover.text} onChange={this.handleCurrentHoverEditorValueChanged} autosize={{ minRows: 3 }} />
                </Form.Item>
              </div>
            </div>
          )}
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

ImageTilesEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, ImageTilesEditor);


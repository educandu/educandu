const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Radio = require('antd/lib/radio');
const clientSettings = require('../../../bootstrap/client-settings');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const { sectionEditorProps } = require('../../../ui/default-prop-types');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

class ImageEditor extends React.Component {
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

  handleMaxWidthValueChanged(value) {
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { type, url, maxWidth } = content;

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
                  addonBefore={`${clientSettings.cdnRootURL}/`}
                  value={url}
                  readOnly
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  fileName={url}
                  onFileNameChanged={this.handleInternalUrlValueChanged}
                  />
              </div>
            </FormItem>
          )}
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

ImageEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = ImageEditor;

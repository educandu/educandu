const React = require('react');
const autoBind = require('auto-bind');
const validation = require('../../../ui/validation');
const { Form, Input, Radio, Switch } = require('antd');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context');
const CdnFilePicker = require('../../../components/cdn-file-picker');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider');
const { sectionEditorProps, clientSettingsProps } = require('../../../ui/default-prop-types');

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

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleYoutubeUrlValueChanged(event) {
    const { value } = event.target;
    this.changeContent({ url: value });
  }

  handleInternalUrlValueChanged(value) {
    this.changeContent({ url: value });
  }

  handleTypeValueChanged(event) {
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

  handleCurrentEditorValueChanged(event) {
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
    const { docKey, content, clientSettings } = this.props;
    const { type, url, text, width, aspectRatio, showVideo } = content;

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
              <RadioButton value="youtube">Youtube</RadioButton>
            </RadioGroup>
          </FormItem>
          {type === TYPE_EXTERNAL && (
            <FormItem label="Externe URL" {...formItemLayout} {...validation.validateUrl(url)} hasFeedback>
              <Input value={url} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {type === TYPE_INTERNAL && (
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
          {type === TYPE_YOUTUBE && (
            <FormItem label="Youtube URL" {...formItemLayout} {...validation.validateUrl(url)} hasFeedback>
              <Input value={url} onChange={this.handleYoutubeUrlValueChanged} />
            </FormItem>
          )}
          <Form.Item label="Seitenverhältnis" {...formItemLayout}>
            <RadioGroup defaultValue="16:9" value={`${aspectRatio.h}:${aspectRatio.v}`} size="small" onChange={this.handleAspectRatioChanged}>
              <RadioButton value="16:9">16:9</RadioButton>
              <RadioButton value="4:3">4:3</RadioButton>
            </RadioGroup>
          </Form.Item>
          <Form.Item label="Videoanzeige" {...formItemLayout}>
            <Switch size="small" defaultChecked checked={showVideo} onChange={this.handleShowVideoChanged} />
          </Form.Item>
          <Form.Item label="Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={this.handleWidthChanged} />
          </Form.Item>
          <Form.Item label="Copyright Infos" {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

VideoEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, VideoEditor);

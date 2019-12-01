const React = require('react');
const autoBind = require('auto-bind');
const Form = require('antd/lib/form');
const Input = require('antd/lib/input');
const Radio = require('antd/lib/radio');
const Switch = require('antd/lib/switch');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');
const { sectionEditorProps, clientSettingsProps } = require('../../../ui/default-prop-types');

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const TextArea = Input.TextArea;

const KIND_AUDIO = 'audio';
const KIND_VIDEO = 'video';

const TYPE_EXTERNAL = 'external';
const TYPE_INTERNAL = 'internal';
const TYPE_YOUTUBE = 'youtube';

class AnavisEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleMediaUrlChanged(newValue) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        url: newValue
      }
    }));
  }

  handleExternalUrlValueChanged(event) {
    this.handleMediaUrlChanged(event.target.value);
  }

  handleYoutubeUrlValueChanged(event) {
    this.handleMediaUrlChanged(event.target.value);
  }

  handleInternalUrlValueChanged(value) {
    this.handleMediaUrlChanged(value);
  }

  handleTypeValueChanged(event) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        type: event.target.value,
        url: '',
        aspectRatio: {
          h: 16,
          v: 9
        }
      }
    }));
  }

  handleAspectRatioChanged(event) {
    const [h, v] = event.target.value.split(':').map(Number);
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        type: event.target.value,
        url: '',
        aspectRatio: { h, v }
      }
    }));
  }

  handleShowVideoChanged(showVideo) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        kind: showVideo ? KIND_VIDEO : KIND_AUDIO
      }
    }));
  }

  handleTextChanged(event) {
    this.changeContent(oldContent => ({
      ...oldContent,
      media: {
        ...oldContent.media,
        text: event.target.value
      }
    }));
  }

  handleWidthChanged(newValue) {
    this.changeContent({ width: newValue });
  }

  changeContent(newContentValuesOrFunc) {
    const { content, onContentChanged } = this.props;
    if (typeof newContentValuesOrFunc === 'function') {
      onContentChanged(newContentValuesOrFunc(content));
    } else {
      onContentChanged({ ...content, ...newContentValuesOrFunc });
    }
  }

  render() {
    const { docKey, content, clientSettings } = this.props;
    const { width, parts, annotations, media } = content;
    const { kind, type, url, text, aspectRatio } = media;

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
            <FormItem label="Externe URL" {...formItemLayout}>
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
            <FormItem label="Youtube URL" {...formItemLayout}>
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
            <Switch size="small" defaultChecked checked={kind === KIND_VIDEO} onChange={this.handleShowVideoChanged} />
          </Form.Item>
          <Form.Item label="Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider defaultValue={100} value={width} onChange={this.handleWidthChanged} />
          </Form.Item>
          <Form.Item label="Copyright Infos" {...formItemLayout}>
            <TextArea value={text} onChange={this.handleTextChanged} autosize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AnavisEditor.propTypes = {
  ...sectionEditorProps,
  ...clientSettingsProps
};

module.exports = inject({
  clientSettings: ClientSettings
}, AnavisEditor);

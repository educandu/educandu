const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Form, Input, Radio } = require('antd');
const clientSettings = require('../../../bootstrap/client-settings');
const CdnFilePicker = require('../../../components/cdn-file-picker.jsx');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

class ImageEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = {
      section: props.section,
      maxWidth: props.section.content.de.maxWidth,
      currentType: props.section.content.de.src.type,
      currentExternalUrl: props.section.content.de.src.type === 'external' ? props.section.content.de.src.type.url : null,
      currentInternalUrl: props.section.content.de.src.type === 'internal' ? props.section.content.de.src.type.url : null
    };
  }

  shouldComponentUpdate() {
    return true;
  }

  handleExternalUrlValueChanged(event) {
    const { value } = event.target;
    this.setState({ currentExternalUrl: value });
    this.changeSrc({ url: value });
  }

  handleInternalUrlValueChanged(value) {
    this.setState({ currentInternalUrl: value });
    this.changeSrc({ url: value });
  }

  handleTypeValueChanged(event) {
    const { value } = event.target;
    const { currentExternalUrl, currentInternalUrl } = this.state;
    const url = value === 'external' ? currentExternalUrl : currentInternalUrl;
    this.setState({ currentType: value });
    this.changeSrc({ type: value, url: url });
  }

  handleMaxWidthValueChanged(value) {
    this.setState({ maxWidth: value });
    this.changeContent({ maxWidth: value });
  }

  changeContent(newContentValues) {
    const oldState = this.state;
    const newState = {
      section: {
        ...oldState.section,
        content: {
          ...oldState.section.content,
          de: {
            ...oldState.section.content.de,
            ...newContentValues
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  changeSrc(newSrcValues) {
    const oldState = this.state;
    const newState = {
      section: {
        ...oldState.section,
        content: {
          ...oldState.section.content,
          de: {
            ...oldState.section.content.de,
            src: {
              ...oldState.section.content.de.src,
              ...newSrcValues
            }
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  render() {
    const { currentType, currentExternalUrl, currentInternalUrl, maxWidth } = this.state;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <FormItem label="Quelle" {...formItemLayout}>
            <RadioGroup value={currentType} onChange={this.handleTypeValueChanged}>
              <RadioButton value="external">Externer Link</RadioButton>
              <RadioButton value="internal">Elmu CDN</RadioButton>
            </RadioGroup>
          </FormItem>
          {currentType === 'external' && (
            <FormItem label="Externe URL" {...formItemLayout}>
              <Input value={currentExternalUrl} onChange={this.handleExternalUrlValueChanged} />
            </FormItem>
          )}
          {currentType === 'internal' && (
            <FormItem label="Interne URL" {...formItemLayout}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Input
                  addonBefore={`${clientSettings.cdnRootURL}/`}
                  value={currentInternalUrl}
                  readOnly
                  />
                <CdnFilePicker
                  rootPrefix="media"
                  fileName={currentInternalUrl}
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
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = ImageEditor;

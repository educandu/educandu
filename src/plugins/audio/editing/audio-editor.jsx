const PropTypes = require('prop-types');
const Radio = require('antd/lib/radio');
const Input = require('antd/lib/input');
const Form = require('antd/lib/form');
const React = require('react');

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class AudioEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { section: props.section };
    this.handleUrlValueChanged = this.handleUrlValueChanged.bind(this);
    this.handleTypeValueChanged = this.handleTypeValueChanged.bind(this);
  }

  shouldComponentUpdate() {
    return true;
  }

  handleUrlValueChanged(event) {
    const { value } = event.target;
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
              url: value
            }
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  handleTypeValueChanged(event) {
    const { value } = event.target;
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
              type: value
            }
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  render() {
    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };
    const { type, url } = this.state.section.content.de.src;
    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="Quelle" {...formItemLayout}>
            <RadioGroup value={type} onChange={this.handleTypeValueChanged}>
              <RadioButton value="external">Externer Link</RadioButton>
              <RadioButton value="internal">Elmu CDN</RadioButton>
            </RadioGroup>
          </Form.Item>
          {type === 'external' && (
            <Form.Item label="Externe URL" {...formItemLayout}>
              <Input value={url} onChange={this.handleUrlValueChanged} />
            </Form.Item>
          )}
          {type === 'internal' && (
            <Form.Item label="CDN-Key" {...formItemLayout}>
              <div style={{ color: 'red' }}>(not implemented)</div>
              <Input value="Hello World!" />
            </Form.Item>
          )}
        </Form>
      </div>
    );
  }
}

AudioEditor.propTypes = {
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = AudioEditor;

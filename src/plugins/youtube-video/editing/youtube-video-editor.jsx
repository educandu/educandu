const Slider = require('antd/lib/slider');
const PropTypes = require('prop-types');
const Input = require('antd/lib/input');
const Form = require('antd/lib/form');
const React = require('react');

class YoutubeVideoEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = { section: props.section };
    this.handleUrlValueChanged = this.handleUrlValueChanged.bind(this);
    this.handleMaxWidthValueChanged = this.handleMaxWidthValueChanged.bind(this);
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
            url: value
          }
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  handleMaxWidthValueChanged(value) {
    const oldState = this.state;
    const newState = {
      section: {
        ...oldState.section,
        content: {
          ...oldState.section.content,
          de: {
            ...oldState.section.content.de,
            maxWidth: value
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
    const marks = {
      25: '25%',
      50: '50%',
      75: '75%',
      100: '100%'
    };
    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="URL" {...formItemLayout}>
            <Input placeholder="URL" value={this.state.section.content.de.url} onChange={this.handleUrlValueChanged} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <Slider marks={marks} step={null} defaultValue={this.state.section.content.de.maxWidth} onChange={this.handleMaxWidthValueChanged} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

YoutubeVideoEditor.propTypes = {
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = YoutubeVideoEditor;

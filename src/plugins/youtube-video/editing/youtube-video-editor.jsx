const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Form, Input } = require('antd');
const ObjectMaxWidthSlider = require('../../../components/object-max-width-slider.jsx');

class YoutubeVideoEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = { section: props.section };
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

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label="URL" {...formItemLayout}>
            <Input placeholder="URL" value={this.state.section.content.de.url} onChange={this.handleUrlValueChanged} />
          </Form.Item>
          <Form.Item label="Maximale Breite" {...formItemLayout}>
            <ObjectMaxWidthSlider value={this.state.section.content.de.maxWidth} onChange={this.handleMaxWidthValueChanged} />
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

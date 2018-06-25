const React = require('react');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Input, message } = require('antd');

const { TextArea } = Input;

class QuickTesterEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
    this.state = { section: props.section };
  }

  handleJSONValueChanged(event) {
    const { value } = event.target;

    let newContent;
    try {
      newContent = JSON.parse(value);
    } catch (err) {
      message.error('Kein gültiges JSON');
      return;
    }

    const oldState = this.state;
    const newState = {
      section: {
        ...oldState.section,
        content: {
          ...oldState.section.content,
          de: newContent
        }
      }
    };
    this.setState(newState);
    this.props.onContentChanged(newState.section.content);
  }

  render() {
    const json = JSON.stringify(this.state.section.content.de, null, 2) || '';
    return (
      <div>
        <TextArea value={json} onChange={this.handleJSONValueChanged} />
      </div>
    );
  }
}

QuickTesterEditor.propTypes = {
  onContentChanged: PropTypes.func.isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = QuickTesterEditor;

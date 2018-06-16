const PropTypes = require('prop-types');
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

  handleMaxWidthValueChanged(event) {
    const { value } = event.target;
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
    return (
      <div>
        <label>Url:</label>
        <input type="text" value={this.state.section.content.de.url} onChange={this.handleUrlValueChanged} />
        <br />
        <label>MaxWidth:</label>
        <input type="text" value={this.state.section.content.de.maxWidth} onChange={this.handleMaxWidthValueChanged} />
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

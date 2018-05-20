const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const PropTypes = require('prop-types');
const React = require('react');

const gfm = new GithubFlavoredMarkdown();

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const defaultState = {
  mode: 'display',
  currentEditorValue: null,
  currentEditorContent: null,
  currentEditorLanguage: null,
  isDirty: false
};

class MarkdownEditor extends React.Component {
  static getDerivedStateFromProps(nextProps, prevState) {
    const newState = {
      ...prevState,
      mode: nextProps.mode
    };

    if (nextProps.mode !== prevState.mode) {
      switch (nextProps.mode) {
        case 'display':
          newState.currentEditorContent = null;
          newState.currentEditorLanguage = null;
          newState.currentEditorValue = null;
          newState.isDirty = false;
          break;
        case 'edit':
          newState.currentEditorContent = clone(nextProps.section.content || {});
          newState.currentEditorLanguage = Object.keys(nextProps.section.content)[0] || nextProps.preferredLanguages[0];
          newState.currentEditorValue = newState.currentEditorContent[newState.currentEditorLanguage] || '';
          newState.isDirty = false;
          break;
        default:
          throw new Error(`Unknown editor mode: ${nextProps.mode}`);
      }
    }

    return newState;
  }

  constructor(props) {
    super(props);
    this.state = Object.assign({}, defaultState);
    this.handleCurrentEditorValueChanged = this.handleCurrentEditorValueChanged.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const prevState = this.state;
    const shouldUpdate = prevState.mode !== nextState.mode
      || prevState.currentEditorLanguage !== nextState.currentEditorLanguage
      || prevState.currentEditorValue !== nextState.currentEditorValue;
    return shouldUpdate;
  }

  componentDidUpdate(prevProps, prevState) {
    const newState = this.state;
    const hasModeChanged = prevState.mode !== newState.mode;
    const hasValueChanged = prevState.currentEditorValue !== newState.currentEditorValue;
    if (hasValueChanged && !hasModeChanged) {
      const { onContentChanged } = this.props;
      onContentChanged(newState.currentEditorContent);
    }
  }

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.setState(prevState => ({
      currentEditorContent: {
        ...prevState.currentEditorContent,
        [prevState.currentEditorLanguage]: newValue
      },
      currentEditorValue: newValue,
      isDirty: true
    }));
  }

  render() {
    const { section } = this.props;
    const { mode, currentEditorValue } = this.state;
    switch (mode) {
      case 'display':
        return (
          <div className="MarkdownEditor" dangerouslySetInnerHTML={{ __html: gfm.render(section.content.de) }} />
        );
      case 'edit':
        return (
          <textarea value={currentEditorValue} onChange={this.handleCurrentEditorValueChanged} />
        );
      default:
        throw new Error(`Unknown editor mode: ${mode}`);
    }
  }
}

MarkdownEditor.propTypes = {
  onContentChanged: PropTypes.func.isRequired,
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = MarkdownEditor;

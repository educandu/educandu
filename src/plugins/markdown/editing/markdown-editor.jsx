const React = require('react');
const autoBind = require('auto-bind');
const Input = require('antd/lib/input');
const { sectionEditorProps } = require('../../../ui/default-prop-types');

const { TextArea } = Input;

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { text } = content;

    return (
      <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autosize={{ minRows: 3 }} />
    );
  }
}

MarkdownEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = MarkdownEditor;

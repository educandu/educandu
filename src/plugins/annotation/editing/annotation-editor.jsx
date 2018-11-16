const React = require('react');
const autoBind = require('auto-bind');
const Input = require('antd/lib/input');
const { sectionEditorProps } = require('../../../ui/default-prop-types');

const { TextArea } = Input;

class AnnotationEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind.react(this);
  }

  handleCurrentEditorValueChanged(event) {
    const newValue = event.target.value;
    this.changeContent({ text: newValue });
  }

  handleDisplayTextChange(event) {
    const newValue = event.target.value;
    this.changeContent({ displayText: newValue });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { text, displayText } = content;

    return (
      <div>
        <Input value={displayText} placeholder="Geben Sie hier einen Anzeigetext ein..." onChange={this.handleDisplayTextChange} />
        <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autosize={{ minRows: 3 }} />
      </div>
    );
  }
}

AnnotationEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = AnnotationEditor;

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

  handleTitleChange(event) {
    const newValue = event.target.value;
    this.changeContent({ title: newValue });
  }

  changeContent(newContentValues) {
    const { content, onContentChanged } = this.props;
    onContentChanged({ ...content, ...newContentValues });
  }

  render() {
    const { content } = this.props;
    const { text, title } = content;

    return (
      <div>
        <Input value={title} placeholder="Geben Sie hier einen Anzeigetext ein..." onChange={this.handleTitleChange} />
        <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autosize={{ minRows: 3 }} />
      </div>
    );
  }
}

AnnotationEditor.propTypes = {
  ...sectionEditorProps
};

module.exports = AnnotationEditor;

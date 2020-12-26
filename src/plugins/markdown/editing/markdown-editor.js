import React from 'react';
import { Input } from 'antd';
import autoBind from 'auto-bind';
import { sectionEditorProps } from '../../../ui/default-prop-types';

const { TextArea } = Input;

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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
      <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
    );
  }
}

MarkdownEditor.propTypes = {
  ...sectionEditorProps
};

export default MarkdownEditor;

import React from 'react';
import autoBind from 'auto-bind';
import { Form, Input } from 'antd';
import validation from '../../../ui/validation';
import { withTranslation } from 'react-i18next';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types';

const FormItem = Form.Item;
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
    const { content, t } = this.props;
    const { text } = content;

    return (
      <FormItem {...validation.validateMarkdown(text, t)}>
        <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
      </FormItem>
    );
  }
}

MarkdownEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation()(MarkdownEditor);

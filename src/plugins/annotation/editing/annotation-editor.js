import React from 'react';
import autoBind from 'auto-bind';
import { Input, Form } from 'antd';
import { withTranslation } from 'react-i18next';
import { sectionEditorProps, translationProps } from '../../../ui/default-prop-types.js';

const { TextArea } = Input;

class AnnotationEditor extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
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
    const { content, t } = this.props;
    const { text, title } = content;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 14 }
    };

    return (
      <div>
        <Form layout="horizontal">
          <Form.Item label={t('title')} {...formItemLayout}>
            <Input value={title} onChange={this.handleTitleChange} />
          </Form.Item>
          <Form.Item label={t('text')} {...formItemLayout}>
            <TextArea value={text} onChange={this.handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </div>
    );
  }
}

AnnotationEditor.propTypes = {
  ...translationProps,
  ...sectionEditorProps
};

export default withTranslation('annotation')(AnnotationEditor);

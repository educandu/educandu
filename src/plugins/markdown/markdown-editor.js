import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

export default function MarkdownEditor({ content, onContentChanged }) {
  const { t } = useTranslation('markdown');
  const { text } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleTextChanged = event => {
    updateContent({ text: event.target.value });
  };

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  return (
    <div>
      <Form>
        <Form.Item label={t('common:text')} {...validation.validateMarkdown(text, t)} {...formItemLayout}>
          <MarkdownInput value={text} onChange={handleTextChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

MarkdownEditor.propTypes = {
  ...sectionEditorProps
};

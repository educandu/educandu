import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

export default function MarkdownWithImageEditor({ content, onContentChanged }) {
  const { t } = useTranslation('markdownWithImage');
  const { text } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleTextChanged = event => {
    updateContent({ text: event.target.value });
  };

  return (
    <div>
      <Form>
        <Form.Item label={t('common:text')} {...validation.validateMarkdown(text, t)} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChanged} renderAnchors />
        </Form.Item>
      </Form>
    </div>
  );
}

MarkdownWithImageEditor.propTypes = {
  ...sectionEditorProps
};

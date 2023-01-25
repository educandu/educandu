import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { validateMarkdown } from '../../ui/validation.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

export default function MarkdownEditor({ content, onContentChanged }) {
  const { t } = useTranslation('markdown');
  const { text, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleTextChanged = event => {
    updateContent({ text: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div>
      <Form labelAlign="left">
        <Form.Item label={t('common:text')} {...validateMarkdown(text, t)} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChanged} renderAnchors />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

MarkdownEditor.propTypes = {
  ...sectionEditorProps
};

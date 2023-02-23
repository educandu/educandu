import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import Info from '../../../src/components/info.js';
import { FORM_ITEM_LAYOUT } from '../../../src/domain/constants.js';
import MarkdownInput from '../../../src/components/markdown-input.js';
import { sectionEditorProps } from '../../../src/ui/default-prop-types.js';
import ObjectWidthSlider from '../../../src/components/object-width-slider.js';

export default function ServerTimeEditor({ content, onContentChanged }) {
  const { t } = useTranslation('testPlugin/serverTime');
  const { text, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTextChanged = event => {
    updateContent({ text: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div className="TestPluginServerTimeEditor">
      <Form labelAlign="left">
        <Form.Item label={t('common:text')} {...FORM_ITEM_LAYOUT}>
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

ServerTimeEditor.propTypes = {
  ...sectionEditorProps
};

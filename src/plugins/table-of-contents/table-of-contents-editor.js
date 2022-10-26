import React from 'react';
import { Form, Slider } from 'antd';
import { useTranslation } from 'react-i18next';
import { range } from '../../utils/array-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const levelRangeSliderMarks = range({ from: 1, to: 6, step: 1 })
  .reduce((all, val) => ({ ...all, [val]: <span>{val}</span> }), {});

export default function TableOfContentsEditor({ content, onContentChanged }) {
  const { t } = useTranslation('tableOfContents');
  const { minLevel, maxLevel, text } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleLevelRangeChange = ([newMinLevel, newMaxLevel]) => {
    triggerContentChanged({ minLevel: newMinLevel, maxLevel: newMaxLevel });
  };

  const handleTextChange = event => {
    triggerContentChanged({ text: event.target.value });
  };

  return (
    <div>
      <Form>
        <Form.Item label={t('levelRange')} {...FORM_ITEM_LAYOUT}>
          <Slider
            range
            min={1}
            max={6}
            step={1}
            marks={levelRangeSliderMarks}
            value={[minLevel, maxLevel]}
            onChange={handleLevelRangeChange}
            />
        </Form.Item>
        <Form.Item label={t('common:text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

TableOfContentsEditor.propTypes = {
  ...sectionEditorProps
};

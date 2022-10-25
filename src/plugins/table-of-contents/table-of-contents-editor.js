import React from 'react';
import { Form, Slider } from 'antd';
import { useTranslation } from 'react-i18next';
import { range } from '../../utils/array-utils.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const levelRangeSliderMarks = range({ from: 1, to: 6, step: 1 })
  .reduce((all, val) => ({ ...all, [val]: <span>{val}</span> }), {});

export default function TableOfContentsEditor({ content, onContentChanged }) {
  const { t } = useTranslation('tableOfContents');
  const { minLevel, maxLevel } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleLevelRangeChange = ([newMinLevel, newMaxLevel]) => {
    updateContent({ minLevel: newMinLevel, maxLevel: newMaxLevel });
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
      </Form>
    </div>
  );
}

TableOfContentsEditor.propTypes = {
  ...sectionEditorProps
};

import React from 'react';
import { Checkbox, Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import StepSlider from '../../components/step-slider.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { MAXIMUM_ALLOWED_UPLOAD_FILE_COUNT } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

export default function FileUploadFieldEditor({ content, onContentChanged }) {
  const { t } = useTranslation('fileUploadField');
  const { label, maxCount, width, allowDragAndDrop } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleLabelChange = event => {
    updateContent({ label: event.target.value });
  };

  const handleMaxSizeChange = value => {
    updateContent({ maxCount: value || 0 });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  const handleAllowDragAndDropChange = event => {
    const { checked } = event.target;
    updateContent({ allowDragAndDrop: checked });
  };

  return (
    <div>
      <Form labelAlign="left">
        <Form.Item label={t('common:label')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={label} onChange={handleLabelChange} />
        </Form.Item>
        <Form.Item label={t('allowDragAndDrop')} {...FORM_ITEM_LAYOUT}>
          <Checkbox checked={allowDragAndDrop} onChange={handleAllowDragAndDropChange} />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('maxCountInfo')}>{t('maxCount')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <StepSlider
            min={1}
            step={1}
            max={MAXIMUM_ALLOWED_UPLOAD_FILE_COUNT}
            value={maxCount}
            marksStep={1}
            labelsStep={1}
            onChange={handleMaxSizeChange}
            />
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

FileUploadFieldEditor.propTypes = {
  ...sectionEditorProps
};

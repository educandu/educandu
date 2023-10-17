import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import StepSlider from '../../components/step-slider.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { MAXIMUM_ALLOWED_UPLOAD_FILE_COUNT } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;

export default function FileUploadFieldEditor({ content, onContentChanged }) {
  const { t } = useTranslation('fileUploadField');
  const { label, maxCount, width } = content;

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

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('common:label')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={label} onChange={handleLabelChange} />
        </FormItem>
        <FormItem
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
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
      </Form>
    </div>
  );
}

FileUploadFieldEditor.propTypes = {
  ...sectionEditorProps
};

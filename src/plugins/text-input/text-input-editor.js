import React from 'react';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { Form, InputNumber, Radio } from 'antd';
import { TEXT_INPUT_MODE } from './constants.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

export default function TextInputEditor({ content, onContentChanged }) {
  const { t } = useTranslation('textInput');
  const { mode, label, maxLength, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleModeChange = event => {
    updateContent({ mode: event.target.value });
  };

  const handleLabelChange = event => {
    updateContent({ label: event.target.value });
  };

  const handleMaxLengthChange = value => {
    updateContent({ maxLength: value || 0 });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('mode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={mode} onChange={handleModeChange}>
            <RadioButton value={TEXT_INPUT_MODE.singleLine}>{t('mode_singleLine')}</RadioButton>
            <RadioButton value={TEXT_INPUT_MODE.multiLine}>{t('mode_multiLine')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:label')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={label} onChange={handleLabelChange} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('maxLengthInfo')}>{t('maxLength')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <InputNumber
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            step={1}
            precision={0}
            value={maxLength}
            onChange={handleMaxLengthChange}
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

TextInputEditor.propTypes = {
  ...sectionEditorProps
};

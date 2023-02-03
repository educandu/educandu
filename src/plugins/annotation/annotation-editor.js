import React from 'react';
import { Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { BEHAVIOR, INTENT } from './constants.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function AnnotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('annotation');
  const { title, text, behavior, intent, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTitleChange = event => {
    updateContent({ title: event.target.value });
  };

  const handleTextChange = event => {
    updateContent({ text: event.target.value });
  };

  const handleBehaviorChange = event => {
    updateContent({ behavior: event.target.value });
  };

  const handleIntentChange = event => {
    updateContent({ intent: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={title} onChange={handleTitleChange} inline />
        </FormItem>
        <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} />
        </FormItem>
        <FormItem label={t('behavior')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={behavior} onChange={handleBehaviorChange}>
            <RadioButton value={BEHAVIOR.expandable}>{t('behavior_expandable')}</RadioButton>
            <RadioButton value={BEHAVIOR.collapsible}>{t('behavior_collapsible')}</RadioButton>
            <RadioButton value={BEHAVIOR.static}>{t('behavior_static')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('intent')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={intent} onChange={handleIntentChange}>
            <RadioButton value={INTENT.neutral}>{t('intent_neutral')}</RadioButton>
            <RadioButton value={INTENT.confirm}>{t('intent_confirm')}</RadioButton>
            <RadioButton value={INTENT.inform}>{t('intent_inform')}</RadioButton>
            <RadioButton value={INTENT.warn}>{t('intent_warn')}</RadioButton>
            <RadioButton value={INTENT.discourage}>{t('intent_discourage')}</RadioButton>
          </RadioGroup>
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

AnnotationEditor.propTypes = {
  ...sectionEditorProps
};

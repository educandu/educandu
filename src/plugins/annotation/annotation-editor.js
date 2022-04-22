import React from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { BEHAVIOR, INTENT } from './constants.js';
import { Checkbox, Form, Input, Radio } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function AnnotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('annotation');
  const { title, text, renderMedia, behavior, intent, width } = content;

  const updateContent = (newContentValues, isInvalid) => {
    onContentChanged({ ...content, ...newContentValues }, isInvalid);
  };

  const handleTitleChange = event => {
    updateContent({ title: event.target.value });
  };

  const handleTextChange = event => {
    updateContent({ text: event.target.value });
  };

  const handleRenderMediaChange = event => {
    updateContent({ renderMedia: event.target.checked });
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

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  return (
    <div>
      <Form>
        <FormItem label={t('common:title')} {...formItemLayout}>
          <Input value={title} onChange={handleTitleChange} />
        </FormItem>
        <FormItem label={t('common:text')} {...validation.validateMarkdown(text, t)} {...formItemLayout}>
          <TextArea value={text} onChange={handleTextChange} autoSize={{ minRows: 3 }} />
        </FormItem>
        <FormItem label={t('common:renderMedia')} {...formItemLayout}>
          <Checkbox checked={renderMedia} onChange={handleRenderMediaChange} />
        </FormItem>
        <FormItem label={t('behavior')} {...formItemLayout}>
          <RadioGroup value={behavior} onChange={handleBehaviorChange}>
            <RadioButton value={BEHAVIOR.expandable}>{t('behavior_expandable')}</RadioButton>
            <RadioButton value={BEHAVIOR.collapsible}>{t('behavior_collapsible')}</RadioButton>
            <RadioButton value={BEHAVIOR.static}>{t('behavior_static')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('intent')} {...formItemLayout}>
          <RadioGroup value={intent} onChange={handleIntentChange}>
            <RadioButton value={INTENT.neutral}>{t('intent_neutral')}</RadioButton>
            <RadioButton value={INTENT.confirm}>{t('intent_confirm')}</RadioButton>
            <RadioButton value={INTENT.inform}>{t('intent_inform')}</RadioButton>
            <RadioButton value={INTENT.warn}>{t('intent_warn')}</RadioButton>
            <RadioButton value={INTENT.discourage}>{t('intent_discourage')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:width')} {...formItemLayout}>
          <ObjectMaxWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
      </Form>
    </div>
  );
}

AnnotationEditor.propTypes = {
  ...sectionEditorProps
};

import React from 'react';
import { STATE } from './constants.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Checkbox, Form, Input, Radio } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const { TextArea } = Input;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function AnnotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('annotation');
  const { title, text, state, renderMedia } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
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

  const handleStateChange = event => {
    updateContent({ state: event.target.value });
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
        <FormItem label={t('state')} {...formItemLayout}>
          <RadioGroup value={state} onChange={handleStateChange}>
            <RadioButton value={STATE.collapsed}>{t('collapsed')}</RadioButton>
            <RadioButton value={STATE.expanded}>{t('expanded')}</RadioButton>
            <RadioButton value={STATE.static}>{t('static')}</RadioButton>
          </RadioGroup>
        </FormItem>
      </Form>
    </div>
  );
}

AnnotationEditor.propTypes = {
  ...sectionEditorProps
};

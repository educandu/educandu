import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;

export default function WhiteboardEditor({ content, onContentChanged }) {
  const { t } = useTranslation('whiteboard');
  const { width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div>
      <Form labelAlign="left">
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

WhiteboardEditor.propTypes = {
  ...sectionEditorProps
};

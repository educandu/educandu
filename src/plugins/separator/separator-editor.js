import React from 'react';
import { Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { COLOR_INTENSITY, TITLE_POSITION } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function SeparatorEditor({ content, onContentChanged }) {
  const { t } = useTranslation('separator');
  const { title, titlePosition, colorIntensity, width } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleTitleChange = event => {
    updateContent({ title: event.target.value });
  };

  const handleTitlePositionChange = event => {
    updateContent({ titlePosition: event.target.value });
  };

  const handleColorIntensityChange = event => {
    updateContent({ colorIntensity: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value });
  };

  return (
    <div className="SeparatorEditor">
      <Form labelAlign="left">
        <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={title} onChange={handleTitleChange} inline />
        </FormItem>
        <FormItem label={t('titlePosition')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={titlePosition} onChange={handleTitlePositionChange}>
            <RadioButton value={TITLE_POSITION.left}>{t('titlePosition_left')}</RadioButton>
            <RadioButton value={TITLE_POSITION.center}>{t('titlePosition_center')}</RadioButton>
            <RadioButton value={TITLE_POSITION.right}>{t('titlePosition_right')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label={t('colorIntensity')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={colorIntensity} onChange={handleColorIntensityChange}>
            <RadioButton value={COLOR_INTENSITY.light}>{t('colorIntensity_light')}</RadioButton>
            <RadioButton value={COLOR_INTENSITY.normal}>{t('colorIntensity_normal')}</RadioButton>
            <RadioButton value={COLOR_INTENSITY.dark}>{t('colorIntensity_dark')}</RadioButton>
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

SeparatorEditor.propTypes = {
  ...sectionEditorProps
};

export default SeparatorEditor;

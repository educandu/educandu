import React from 'react';
import { Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { IMAGE_POSITION } from './constants.js';
import UrlInput from '../../components/url-input.js';
import StepSlider from '../../components/step-slider.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import { useNumberWithUnitFormat } from '../../components/locale-context.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function MarkdownWithImageEditor({ content, onContentChanged }) {
  const { t } = useTranslation('markdownWithImage');
  const emFormatter = useNumberWithUnitFormat({ unit: 'em' });

  const { text, textOffsetInEm, width, image } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleTextChange = event => {
    changeContent({ text: event.target.value });
  };

  const handleTextOffsetInEmChange = value => {
    changeContent({ textOffsetInEm: value });
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  const handleImageSourceUrlChange = (value, metadata) => {
    const newImage = {
      ...image,
      sourceUrl: value,
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    };
    changeContent({ image: newImage });
  };

  const handleImageCopyrightNoticeChange = event => {
    const { value } = event.target;
    changeContent({ image: { ...image, copyrightNotice: value } });
  };

  const handleImageWidthChange = value => {
    changeContent({ image: { ...image, width: value } });
  };

  const handleImagePositionChange = event => {
    const { value } = event.target;
    changeContent({ image: { ...image, position: value } });
  };

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} renderAnchors />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('textOffsetInfo')}>{t('textOffsetLabel')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <StepSlider
            min={0}
            max={2}
            step={0.25}
            marksStep={0.25}
            labelsStep={0.5}
            value={textOffsetInEm}
            formatter={emFormatter}
            onChange={handleTextOffsetInEmChange}
            />
        </FormItem>
        <FormItem {...FORM_ITEM_LAYOUT} label={t('imageUrl')}>
          <UrlInput
            value={image.sourceUrl}
            onChange={handleImageSourceUrlChange}
            allowedSourceTypes={allowedImageSourceTypes}
            />
        </FormItem>
        <Form.Item label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={image.copyrightNotice} onChange={handleImageCopyrightNoticeChange} />
        </Form.Item>
        <FormItem label={t('imagePosition')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={image.position} onChange={handleImagePositionChange}>
            <RadioButton value={IMAGE_POSITION.left}>{t('left')}</RadioButton>
            <RadioButton value={IMAGE_POSITION.right}>{t('right')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem
          className="ImageEditor-widthInput"
          label={<Info tooltip={t('imageWidthInfo')}>{t('imageWidth')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={image.width} onChange={handleImageWidthChange} />
        </FormItem>
        <FormItem
          className="ImageEditor-widthInput"
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
      </Form>
    </div>
  );
}

MarkdownWithImageEditor.propTypes = {
  ...sectionEditorProps
};

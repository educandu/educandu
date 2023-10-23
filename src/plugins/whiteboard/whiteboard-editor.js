import React from 'react';
import { Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { OPTIMAL_VIEWPORT_WIDTH_FACTOR } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

export default function WhiteboardEditor({ content, onContentChanged }) {
  const { t } = useTranslation('whiteboard');
  const { width, aspectRatio, image } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleWidthChange = value => {
    updateContent({ width: value, viewportWidth: value * OPTIMAL_VIEWPORT_WIDTH_FACTOR });
  };

  const handleAspectRatioChange = event => {
    updateContent({ aspectRatio: event.target.value });
  };

  const handleImageSourceUrlChange = (value, metadata) => {
    const newImage = {
      ...image,
      sourceUrl: value,
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    };
    updateContent({ image: newImage });
  };

  const handleImageCopyrightNoticeChange = event => {
    const { value } = event.target;
    updateContent({ image: { ...image, copyrightNotice: value } });
  };
  return (
    <div>
      <Form labelAlign="left">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:imageUrl')}>
          <UrlInput
            value={image.sourceUrl}
            onChange={handleImageSourceUrlChange}
            allowedSourceTypes={allowedImageSourceTypes}
            />
        </FormItem>
        <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={image.copyrightNotice} onChange={handleImageCopyrightNoticeChange} />
        </FormItem>
        <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} onChange={handleAspectRatioChange}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
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

WhiteboardEditor.propTypes = {
  ...sectionEditorProps
};

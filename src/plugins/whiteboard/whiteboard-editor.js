import React from 'react';
import { Checkbox, Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { OPTIMAL_VIEWPORT_WIDTH_FACTOR } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import CopyrightNoticeEditor from '../../components/copyright-notice-editor.js';
import ExtendedAspectRatioPicker from '../../components/extended-aspect-ratio-picker.js';

const FormItem = Form.Item;

const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

export default function WhiteboardEditor({ content, onContentChanged }) {
  const { t } = useTranslation('whiteboard');
  const { label, width, aspectRatio, image } = content;

  const updateContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleLabelChange = event => {
    updateContent({ label: event.target.value });
  };

  const handleWidthChange = value => {
    updateContent({ width: value, viewportWidth: value * OPTIMAL_VIEWPORT_WIDTH_FACTOR });
  };

  const handleAspectRatioChange = value => {
    updateContent({ aspectRatio: value });
  };

  const handleIsBorderVisibleValueChanged = event => {
    const { checked } = event.target;
    updateContent({ isBorderVisible: checked });
  };

  const handleImageSourceUrlChange = value => {
    const newImage = { ...image, sourceUrl: value };

    updateContent({ image: newImage });
  };

  const handleImageCopyrightNoticeChange = value => {
    updateContent({ image: { ...image, copyrightNotice: value } });
  };
  return (
    <div>
      <Form labelAlign="left">
        <FormItem label={t('common:label')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={label} onChange={handleLabelChange} />
        </FormItem>
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:imageUrl')}>
          <UrlInput
            value={image.sourceUrl}
            onChange={handleImageSourceUrlChange}
            allowedSourceTypes={allowedImageSourceTypes}
            />
        </FormItem>
        <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <CopyrightNoticeEditor
            value={image.copyrightNotice}
            sourceUrl={image.sourceUrl}
            onChange={handleImageCopyrightNoticeChange}
            />
        </FormItem>
        <Form.Item label={t('common:border')} {...FORM_ITEM_LAYOUT}>
          <Checkbox checked={content.isBorderVisible} onChange={handleIsBorderVisibleValueChanged} />
        </Form.Item>
        <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <ExtendedAspectRatioPicker value={aspectRatio} onChange={handleAspectRatioChange} />
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

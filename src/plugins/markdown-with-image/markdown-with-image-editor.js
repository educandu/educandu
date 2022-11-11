import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { IMAGE_POSITION } from './constants.js';
import UrlInput from '../../components/url-input.js';
import { Checkbox, Form, Radio, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

export default function MarkdownWithImageEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('markdownWithImage');

  const { text, image } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalid = !isInternalSourceType({ url: newContent.image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
      && validation.getUrlValidationStatus(newContent.image.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleTextChange = event => {
    changeContent({ text: event.target.value });
  };

  const handleImageSourceUrlChange = value => {
    changeContent({ image: { ...image, sourceUrl: value } });
  };

  const handleImageCopyrightNoticeChange = event => {
    const { value } = event.target;
    changeContent({ image: { ...image, copyrightNotice: value } });
  };

  const handleImageWidthChange = value => {
    changeContent({ image: { ...image, width: value } });
  };

  const handleImageBorderChange = event => {
    const { checked } = event.target;
    changeContent({ image: { ...image, border: checked } });
  };

  const handleImagePositionChange = event => {
    const { value } = event.target;
    changeContent({ image: { ...image, position: value } });
  };

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div>
      <Form>
        <FormItem label={t('common:text')} {...validation.validateMarkdown(text, t)} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} renderAnchors />
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
        <FormItem
          className="ImageEditor-widthInput"
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('imageWidth')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={image.width} onChange={handleImageWidthChange} />
        </FormItem>
        <FormItem label={t('imagePosition')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={image.position} onChange={handleImagePositionChange}>
            <RadioButton value={IMAGE_POSITION.left}>{t('left')}</RadioButton>
            <RadioButton value={IMAGE_POSITION.right}>{t('right')}</RadioButton>
          </RadioGroup>
        </FormItem>
        <Form.Item label={t('imageBorder')} {...FORM_ITEM_LAYOUT}>
          <Checkbox checked={image.border} onChange={handleImageBorderChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

MarkdownWithImageEditor.propTypes = {
  ...sectionEditorProps
};

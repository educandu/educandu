import { useTranslation } from 'react-i18next';
import { IMAGE_POSITION } from './constants.js';
import React, { Fragment, useMemo } from 'react';
import { Form, Radio, Slider, Tooltip } from 'antd';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded, range } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { useNumberFormat } from '../../components/locale-context.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const possibleTextOffsetValues = range({ from: 0, to: 2, step: 0.25 });
const maxTextOffsetValue = possibleTextOffsetValues[possibleTextOffsetValues.length - 1];

export default function MarkdownWithImageEditor({ content, onContentChanged }) {
  const { formatNumber } = useNumberFormat();
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('markdownWithImage');

  const { text, textOffsetInEm, image } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalid = !isInternalSourceType({ url: newContent.image.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
      && validation.getUrlValidationStatus(newContent.image.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleTextChange = event => {
    changeContent({ text: event.target.value });
  };

  const handleTextOffsetInEmChange = value => {
    changeContent({ textOffsetInEm: value });
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

  const handleImagePositionChange = event => {
    const { value } = event.target;
    changeContent({ image: { ...image, position: value } });
  };

  const textOffsetSliderTipFormatter = useMemo(() => {
    return val => `${formatNumber(val)}\u00A0em`;
  }, [formatNumber]);

  const textOffsetSliderMarks = useMemo(() => {
    return possibleTextOffsetValues.reduce((all, val) => {
      const markLabel = val % 0.5 === 0 ? textOffsetSliderTipFormatter(val) : '';
      const node = <span>{markLabel}</span>;
      return { ...all, [val]: node };
    }, {});
  }, [textOffsetSliderTipFormatter]);

  const allowedImageSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div>
      <Form>
        <FormItem label={t('common:text')} {...validation.validateMarkdown(text, t)} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={text} onChange={handleTextChange} renderAnchors />
        </FormItem>
        <FormItem
          label={
            <Fragment>
              <Tooltip title={t('textOffsetInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('textOffsetLabel')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <Slider
            min={0}
            max={maxTextOffsetValue}
            marks={textOffsetSliderMarks}
            step={null}
            value={textOffsetInEm}
            onChange={handleTextOffsetInEmChange}
            tipFormatter={textOffsetSliderTipFormatter}
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
      </Form>
    </div>
  );
}

MarkdownWithImageEditor.propTypes = {
  ...sectionEditorProps
};

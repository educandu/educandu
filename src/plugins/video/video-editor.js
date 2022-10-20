import React, { Fragment } from 'react';
import { Form, Radio, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { getSourceType, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function VideoEditor({ content, onContentChanged }) {
  const { t } = useTranslation('video');
  const clientConfig = useService(ClientConfig);

  const { sourceUrl, copyrightNotice, width, aspectRatio, posterImage } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewPosterImageSourceTypeInternal = isInternalSourceType({ url: newContent.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid
      = (!isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error)
      || (isNewPosterImageSourceTypeInternal && validation.getUrlValidationStatus(newContent.posterImage.sourceUrl) === URL_VALIDATION_STATUS.error);

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = url => {
    const newSourceType = getSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });

    const newCopyrightNotice = newSourceType === SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: url })
      : '';

    changeContent({ sourceUrl: url, copyrightNotice: newCopyrightNotice });
  };

  const handlePosterImageSourceUrlChange = url => {
    changeContent({ posterImage: { sourceUrl: url } });
  };

  const handleAspectRatioChange = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleCopyrightNoticeChange = event => {
    const { value } = event.target;
    changeContent({ copyrightNotice: value });
  };

  const handleWidthChange = newValue => {
    changeContent({ width: newValue });
  };

  const validationPropsSourceUrl = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(sourceUrl, t, { allowEmpty: true });

  const validationPropsPosterImageSourceUrl = isInternalSourceType({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(posterImage.sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT} {...validationPropsSourceUrl}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <FormItem label={t('posterImageUrl')} {...FORM_ITEM_LAYOUT} {...validationPropsPosterImageSourceUrl}>
          <UrlInput
            value={posterImage.sourceUrl}
            onChange={handlePosterImageSourceUrlChange}
            allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
            />
        </FormItem>
        <Form.Item label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} size="small" onChange={handleAspectRatioChange}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

VideoEditor.propTypes = {
  ...sectionEditorProps
};

export default VideoEditor;

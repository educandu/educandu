import { Form, Radio } from 'antd';
import React, { useState } from 'react';
import Info from '../../components/info.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { handleError } from '../../ui/error-helper.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getMediaInformation } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, SOURCE_TYPE } from '../../domain/constants.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';
import { getUrlValidationStatus, URL_VALIDATION_STATUS, validateUrl } from '../../ui/validation.js';
import { getAccessibleUrl, getSourceType, isInternalSourceType } from '../../utils/source-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const logger = new Logger(import.meta.url);

function VideoEditor({ content, onContentChanged }) {
  const { t } = useTranslation('video');
  const clientConfig = useService(ClientConfig);

  const [sourceDuration, setSourceDuration] = useState(0);
  const { sourceUrl, playbackRange, copyrightNotice, width, aspectRatio, posterImage } = content;

  const determineMediaInformationFromUrl = async url => {
    const mediaInfo = await getMediaInformation({ url, playbackRange, cdnRootUrl: clientConfig.cdnRootUrl });
    setSourceDuration(mediaInfo.duration);

    return mediaInfo;
  };

  useOnComponentMounted(async () => {
    await determineMediaInformationFromUrl(sourceUrl);
  });

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewPosterImageSourceTypeInternal = isInternalSourceType({ url: newContent.posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid
      = (!isNewSourceTypeInternal && getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error)
      || (isNewPosterImageSourceTypeInternal && getUrlValidationStatus(newContent.posterImage.sourceUrl) === URL_VALIDATION_STATUS.error);

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = async url => {
    const { sanitizedUrl, range, error } = await determineMediaInformationFromUrl(url);

    const newSourceType = getSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewSourceTypeInternal = isInternalSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });

    const newCopyrightNotice = newSourceType === SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: url })
      : '';

    changeContent({
      sourceUrl: newSourceType === SOURCE_TYPE.unsupported || isNewSourceTypeInternal ? url : sanitizedUrl,
      playbackRange: range,
      copyrightNotice: newCopyrightNotice
    });

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
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
    : validateUrl(sourceUrl, t, { allowEmpty: true });

  const validationPropsPosterImageSourceUrl = isInternalSourceType({ url: posterImage.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validateUrl(posterImage.sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT} {...validationPropsSourceUrl}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput playbackRange={playbackRange} sourceDuration={sourceDuration} />
            <MediaRangeSelector
              range={playbackRange}
              onRangeChange={handlePlaybackRangeChange}
              sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              />
          </div>
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
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
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

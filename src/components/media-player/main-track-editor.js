import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import React, { Fragment, useState } from 'react';
import { Form, Input, Radio, Switch } from 'antd';
import { useService } from '../container-context.js';
import { handleError } from '../../ui/error-helper.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import MediaRangeSelector from './media-range-selector.js';
import { usePercentageFormat } from '../locale-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getResourceType } from '../../utils/resource-utils.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { formatMediaPosition, getMediaInformation } from '../../utils/media-utils.js';
import { getAccessibleUrl, getSourceType, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, RESOURCE_TYPE, SOURCE_TYPE } from '../../domain/constants.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function MainTrackEditor({ content, onContentChanged, useShowVideo, useAspectRatio }) {
  const clientConfig = useService(ClientConfig);
  const { t } = useTranslation('mainTrackEditor');
  const formatPercentage = usePercentageFormat({ decimalPlaces: 2 });

  const [sourceDuration, setSourceDuration] = useState(0);
  const { sourceUrl, playbackRange, copyrightNotice, aspectRatio, showVideo } = content;

  const determineMediaInformationFromUrl = async url => {
    const result = await getMediaInformation({ url, playbackRange, cdnRootUrl: clientConfig.cdnRootUrl });
    setSourceDuration(result.duration);

    return result;
  };

  useOnComponentMounted(async () => {
    await determineMediaInformationFromUrl(sourceUrl);
  });

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalidSourceUrl = !isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceUrlChange = async value => {
    const { sanitizedUrl, range, resourceType, error } = await determineMediaInformationFromUrl(value);
    const newSourceType = getSourceType({ url: value, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewSourceTypeInternal = isInternalSourceType({ url: value, cdnRootUrl: clientConfig.cdnRootUrl });

    const newCopyrightNotice = newSourceType === SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : '';

    const newContent = {
      sourceUrl: newSourceType === SOURCE_TYPE.unsupported || isNewSourceTypeInternal ? value : sanitizedUrl,
      playbackRange: range,
      copyrightNotice: newCopyrightNotice
    };

    if (useShowVideo) {
      newContent.showVideo = resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown;
    }

    changeContent(newContent);

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
  };

  const handleAspectRatioChanged = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handleShowVideoChanged = newShowVideo => {
    changeContent({ showVideo: newShowVideo });
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  const renderPlaybackRangeInfo = () => {
    const from = playbackRange[0] !== 0
      ? formatMediaPosition({ formatPercentage, position: playbackRange[0], duration: sourceDuration })
      : 'start';

    const to = playbackRange[1] !== 1
      ? formatMediaPosition({ formatPercentage, position: playbackRange[1], duration: sourceDuration })
      : 'end';

    return t('playbackRangeInfo', { from, to });
  };

  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <Fragment>
      <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      {useAspectRatio && (
        <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup
            size="small"
            defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
            value={aspectRatio}
            onChange={handleAspectRatioChanged}
            disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
            >
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </FormItem>
      )}
      {useShowVideo && (
        <FormItem label={t('common:videoDisplay')} {...FORM_ITEM_LAYOUT}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
            />
        </FormItem>
      )}
      <FormItem label={t('playbackRange')} {...FORM_ITEM_LAYOUT}>
        <div className="u-input-and-button">
          <Input value={renderPlaybackRangeInfo()} readOnly />
          <MediaRangeSelector
            range={playbackRange}
            onRangeChange={handlePlaybackRangeChange}
            sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
            />
        </div>
      </FormItem>
      <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

MainTrackEditor.propTypes = {
  content: PropTypes.shape({
    sourceUrl: PropTypes.string,
    showVideo: PropTypes.bool,
    aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
    playbackRange: PropTypes.arrayOf(PropTypes.number),
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired,
  useAspectRatio: PropTypes.bool,
  useShowVideo: PropTypes.bool
};

MainTrackEditor.defaultProps = {
  useAspectRatio: true,
  useShowVideo: true
};

export default MainTrackEditor;

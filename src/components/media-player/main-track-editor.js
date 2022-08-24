import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import MarkdownInput from '../markdown-input.js';
import React, { Fragment, useState } from 'react';
import { Form, Input, Radio, Switch } from 'antd';
import { useService } from '../container-context.js';
import { handleError } from '../../ui/error-helper.js';
import { useNumberFormat } from '../locale-context.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import MediaRangeSelector from './media-range-selector.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getResourceType } from '../../utils/resource-utils.js';
import ResourcePicker from '../resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { formatMediaPosition, getFullSourceUrl, getMediaInformation } from '../../utils/media-utils.js';
import { CDN_URL_PREFIX, MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE, RESOURCE_TYPE } from '../../domain/constants.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function MainTrackEditor({ content, onContentChanged }) {
  const clientConfig = useService(ClientConfig);
  const { formatPercentage } = useNumberFormat();
  const { t } = useTranslation('mainTrackEditor');
  const [sourceDuration, setSourceDuration] = useState(0);
  const { sourceType, sourceUrl, playbackRange, copyrightNotice, aspectRatio, showVideo } = content;

  const determineMediaInformationFromUrl = async url => {
    const result = await getMediaInformation({
      t,
      url,
      sourceType,
      playbackRange,
      cdnRootUrl: clientConfig.cdnRootUrl
    });

    setSourceDuration(result.duration);

    return result;
  };

  useOnComponentMounted(async () => {
    await determineMediaInformationFromUrl(sourceUrl);
  });

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      range: [0, 1],
      showVideo: false,
      copyrightNotice: ''
    });
  };

  const handleSourceUrlChangeComplete = async value => {
    const { sanitizedUrl, range, resourceType, error } = await determineMediaInformationFromUrl(value);

    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    changeContent({
      sourceUrl: sourceType !== MEDIA_SOURCE_TYPE.internal ? sanitizedUrl : value,
      showVideo: resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown,
      playbackRange: range,
      copyrightNotice: newCopyrightNotice
    });

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handleSourceUrlChange = event => {
    changeContent({ sourceUrl: event.target.value });
  };

  const handleSourceUrlBlur = event => {
    handleSourceUrlChangeComplete(event.target.value);
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

  return (
    <Fragment>
      <FormItem label={t('common:source')} {...formItemLayout}>
        <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
          <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
          <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
          <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {sourceType === MEDIA_SOURCE_TYPE.external && (
      <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
        <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
      </FormItem>
      )}
      {sourceType === MEDIA_SOURCE_TYPE.internal && (
      <FormItem label={t('common:internalUrl')} {...formItemLayout}>
        <div className="u-input-and-button">
          <Input
            addonBefore={CDN_URL_PREFIX}
            value={sourceUrl}
            onChange={handleSourceUrlChange}
            onBlur={handleSourceUrlBlur}
            />
          <ResourcePicker
            url={storageLocationPathToUrl(sourceUrl)}
            onUrlChange={url => handleSourceUrlChangeComplete(urlToStorageLocationPath(url))}
            />
        </div>
      </FormItem>
      )}
      {sourceType === MEDIA_SOURCE_TYPE.youtube && (
      <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
        <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
      </FormItem>
      )}
      <FormItem label={t('common:aspectRatio')} {...formItemLayout}>
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
      <FormItem label={t('common:videoDisplay')} {...formItemLayout}>
        <Switch
          size="small"
          checked={showVideo}
          onChange={handleShowVideoChanged}
          disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
          />
      </FormItem>
      <FormItem label={t('playbackRange')} {...formItemLayout}>
        <div className="u-input-and-button">
          <Input value={renderPlaybackRangeInfo()} readOnly />
          <MediaRangeSelector
            range={playbackRange}
            onRangeChange={handlePlaybackRangeChange}
            sourceUrl={getFullSourceUrl({ url: sourceUrl, sourceType, cdnRootUrl: clientConfig.cdnRootUrl })}
            />
        </div>
      </FormItem>
      <FormItem label={t('common:copyrightNotice')} {...formItemLayout}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

MainTrackEditor.propTypes = {
  content: PropTypes.shape({
    sourceType: PropTypes.oneOf(Object.values(MEDIA_SOURCE_TYPE)),
    sourceUrl: PropTypes.string,
    showVideo: PropTypes.bool,
    aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
    playbackRange: PropTypes.arrayOf(PropTypes.number),
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired
};

export default MainTrackEditor;

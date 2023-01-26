import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { Form, Radio, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import MediaRangeSelector from './media-range-selector.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { getResourceType } from '../../utils/resource-utils.js';
import { isYoutubeSourceType } from '../../utils/source-utils.js';
import MediaRangeReadonlyInput from './media-range-readonly-input.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, RESOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function MainTrackEditor({ content, onContentChanged, useShowVideo, useAspectRatio }) {
  const { t } = useTranslation('mainTrackEditor');

  const { sourceUrl, playbackRange, copyrightNotice, aspectRatio, showVideo } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = value => {
    const newContent = {
      sourceUrl: value,
      playbackRange: [0, 1],
      copyrightNotice: isYoutubeSourceType(value)
        ? t('common:youtubeCopyrightNotice', { link: value })
        : ''
    };

    if (useShowVideo) {
      const { resourceType } = analyzeMediaUrl(value);
      newContent.showVideo = resourceType === RESOURCE_TYPE.video || resourceType === RESOURCE_TYPE.unknown;
    }

    changeContent(newContent);
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

  return (
    <Fragment>
      <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
        <div className="u-input-and-button">
          <MediaRangeReadonlyInput sourceUrl={sourceUrl} playbackRange={playbackRange} />
          <MediaRangeSelector sourceUrl={sourceUrl} range={playbackRange} onRangeChange={handlePlaybackRangeChange} />
        </div>
      </FormItem>
      {!!useAspectRatio && (
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
      {!!useShowVideo && (
        <FormItem label={t('common:videoDisplay')} {...FORM_ITEM_LAYOUT}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={![RESOURCE_TYPE.video, RESOURCE_TYPE.none].includes(getResourceType(sourceUrl))}
            />
        </FormItem>
      )}
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

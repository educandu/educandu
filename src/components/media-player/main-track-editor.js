import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { Form, Radio, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import MediaRangeSelector from './media-range-selector.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MediaRangeReadonlyInput from './media-range-readonly-input.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, RESOURCE_TYPE, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const shouldDisableVideo = sourceUrl => {
  const { resourceType } = analyzeMediaUrl(sourceUrl);
  return ![RESOURCE_TYPE.video, RESOURCE_TYPE.none, RESOURCE_TYPE.unknown].includes(resourceType);
};

function MainTrackEditor({ content, onContentChanged, useShowVideo, useAspectRatio, usePosterImage }) {
  const { t } = useTranslation('mainTrackEditor');

  const { sourceUrl, playbackRange, copyrightNotice, aspectRatio, showVideo, posterImage } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = (value, metadata) => {
    const newContent = {
      sourceUrl: value,
      playbackRange: [0, 1],
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    };

    if (useShowVideo) {
      newContent.showVideo = !shouldDisableVideo(newContent.sourceUrl);
    }

    if (usePosterImage && shouldDisableVideo(newContent.sourceUrl)) {
      newContent.posterImage = { sourceUrl: '' };
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
    const newContent = { showVideo: newShowVideo };

    if (usePosterImage && !newShowVideo) {
      newContent.posterImage = { sourceUrl: '' };
    }

    changeContent(newContent);
  };

  const handlePosterImageSourceUrlChange = url => {
    changeContent({ posterImage: { sourceUrl: url } });
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
            defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
            value={aspectRatio}
            onChange={handleAspectRatioChanged}
            disabled={shouldDisableVideo(sourceUrl)}
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
            disabled={shouldDisableVideo(sourceUrl)}
            />
        </FormItem>
      )}
      {!!usePosterImage && (
        <FormItem label={t('common:posterImageUrl')} {...FORM_ITEM_LAYOUT}>
          <UrlInput
            value={posterImage.sourceUrl}
            onChange={handlePosterImageSourceUrlChange}
            allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
            disabled={shouldDisableVideo(sourceUrl) || (useShowVideo && !showVideo)}
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
    copyrightNotice: PropTypes.string,
    posterImage: PropTypes.shape({
      sourceUrl: PropTypes.string
    })
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired,
  useShowVideo: PropTypes.bool,
  useAspectRatio: PropTypes.bool,
  usePosterImage: PropTypes.bool
};

MainTrackEditor.defaultProps = {
  useShowVideo: true,
  useAspectRatio: true,
  usePosterImage: true
};

export default MainTrackEditor;

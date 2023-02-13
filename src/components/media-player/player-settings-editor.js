import Info from '../info.js';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { Form, Radio, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStableCallback } from '../../ui/hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import ObjectWidthSlider from '../object-width-slider.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { memoAndTransformProps } from '../../ui/react-helper.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function PlayerSettingsEditor({ content, useShowVideo, useAspectRatio, usePosterImage, disableVideo, onContentChange }) {
  const { t } = useTranslation('playerSettingsEditor');

  const { showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChange(newContent);
  };

  const handleShowVideoChanged = newShowVideo => {
    const newContent = { showVideo: newShowVideo };

    if (usePosterImage && !newShowVideo) {
      newContent.posterImage = { sourceUrl: '' };
    }

    changeContent(newContent);
  };

  const handleAspectRatioChanged = event => {
    changeContent({ aspectRatio: event.target.value });
  };

  const handlePosterImageSourceUrlChange = url => {
    changeContent({ posterImage: { sourceUrl: url } });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
  };

  return (
    <Fragment>
      {!!useShowVideo && (
        <FormItem label={t('common:videoDisplay')} {...FORM_ITEM_LAYOUT}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={disableVideo}
            />
        </FormItem>
      )}
      {!!useAspectRatio && (
        <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup
            defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine}
            value={aspectRatio}
            disabled={disableVideo || (useShowVideo && !showVideo)}
            onChange={handleAspectRatioChanged}
            >
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </FormItem>
      )}
      {!!usePosterImage && (
        <FormItem label={t('common:posterImageUrl')} {...FORM_ITEM_LAYOUT}>
          <UrlInput
            value={posterImage.sourceUrl}
            onChange={handlePosterImageSourceUrlChange}
            allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
            disabled={disableVideo || (useShowVideo && !showVideo)}
            />
        </FormItem>
      )}
      <FormItem
        label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
        {...FORM_ITEM_LAYOUT}
        >
        <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
      </FormItem>
      <FormItem
        label={<Info tooltip={t('common:multitrackInitialVolumeInfo')}>{t('common:initialVolume')}</Info>}
        {...FORM_ITEM_LAYOUT}
        >
        <MediaVolumeSlider
          value={initialVolume}
          useValueLabel
          useButton={false}
          onChange={handleInitialVolumeChange}
          />
      </FormItem>
    </Fragment>
  );
}

PlayerSettingsEditor.propTypes = {
  content: PropTypes.shape({
    showVideo: PropTypes.bool,
    aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
    posterImage: PropTypes.shape({
      sourceUrl: PropTypes.string
    }),
    width: PropTypes.number,
    initialVolume: PropTypes.number
  }).isRequired,
  useShowVideo: PropTypes.bool,
  useAspectRatio: PropTypes.bool,
  usePosterImage: PropTypes.bool,
  disableVideo: PropTypes.bool,
  onContentChange: PropTypes.func.isRequired
};

PlayerSettingsEditor.defaultProps = {
  useShowVideo: true,
  useAspectRatio: true,
  usePosterImage: true,
  disableVideo: false
};

export default memoAndTransformProps(PlayerSettingsEditor, ({
  onContentChange,
  ...rest
}) => ({
  onContentChange: useStableCallback(onContentChange),
  ...rest
}));

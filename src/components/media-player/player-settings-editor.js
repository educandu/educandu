import Info from '../info.js';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { Form, Radio, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useStableCallback } from '../../ui/hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import ObjectWidthSlider from '../object-width-slider.js';
import WarningIcon from '../icons/general/warning-icon.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { memoAndTransformProps } from '../../ui/react-helper.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, MULTITRACK_PLAYER_TYPE, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function PlayerSettingsEditor({ content, useMultitrackPlayerType, useShowVideo, useAspectRatio, usePosterImage, useWidth, disableVideo, onContentChange }) {
  const { t } = useTranslation('playerSettingsEditor');

  const { multitrackPlayerType, showVideo, aspectRatio, posterImage, width, initialVolume } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChange(newContent);
  };

  const handleMultitrackPlayerTypeChanged = event => {
    const newMultitrackPlayerType = event.target.value;

    const newContent = { multitrackPlayerType: newMultitrackPlayerType };

    if (useShowVideo && newMultitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise) {
      newContent.showVideo = false;
    }

    if (useAspectRatio && newMultitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise) {
      newContent.aspectRatio = MEDIA_ASPECT_RATIO.sixteenToNine;
    }

    if (usePosterImage && newMultitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise) {
      newContent.posterImage = { sourceUrl: '' };
    }

    changeContent(newContent);
  };

  const handleShowVideoChanged = newShowVideo => {
    const newContent = { showVideo: newShowVideo };

    if (useAspectRatio && !newShowVideo) {
      newContent.aspectRatio = MEDIA_ASPECT_RATIO.sixteenToNine;
    }

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
      {!!useMultitrackPlayerType && (
        <FormItem label={t('multitrackPlayerType')} {...FORM_ITEM_LAYOUT}>
          <div className='PlayerSettingsEditor-playerTypeValue'>
            <RadioGroup
              defaultValue={MULTITRACK_PLAYER_TYPE.default}
              value={multitrackPlayerType}
              onChange={handleMultitrackPlayerTypeChanged}
              >
              <RadioButton value={MULTITRACK_PLAYER_TYPE.default}>{t('multitrackPlayerType_default')}</RadioButton>
              <RadioButton value={MULTITRACK_PLAYER_TYPE.precise}>{t('multitrackPlayerType_precise')}</RadioButton>
            </RadioGroup>
            <div className="PlayerSettingsEditor-playerTypeValueInfo">
              {multitrackPlayerType === MULTITRACK_PLAYER_TYPE.default
                ? t('multitrackPlayerTypeInfo_default')
                : t('multitrackPlayerTypeInfo_precise')}
            </div>
            <div className="PlayerSettingsEditor-playerTypeValueWarning">
              {multitrackPlayerType === MULTITRACK_PLAYER_TYPE.default && (
                <Fragment>
                  <WarningIcon className="PlayerSettingsEditor-playerTypeValueWarningIcon" />
                  <div>{t('multitrackPlayerTypeWarning1_default')}</div>
                  <WarningIcon className="PlayerSettingsEditor-playerTypeValueWarningIcon" />
                  <div>{t('multitrackPlayerTypeWarning2_default')}</div>
                </Fragment>
              )}
              {multitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise && (
                <Fragment>
                  <WarningIcon className="PlayerSettingsEditor-playerTypeValueWarningIcon" />
                  <div>{t('multitrackPlayerTypeWarning_precise')}</div>
                </Fragment>
              )}
            </div>
          </div>
        </FormItem>
      )}
      {!!useShowVideo && (
        <FormItem label={t('videoDisplay')} {...FORM_ITEM_LAYOUT}>
          <Switch
            size="small"
            checked={showVideo}
            onChange={handleShowVideoChanged}
            disabled={disableVideo || (useMultitrackPlayerType && multitrackPlayerType === MULTITRACK_PLAYER_TYPE.precise)}
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
      {!!useWidth && (
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
      )}
      <FormItem
        label={<Info tooltip={t('multitrackInitialVolumeInfo')}>{t('common:initialVolume')}</Info>}
        {...FORM_ITEM_LAYOUT}
        >
        <MediaVolumeSlider
          value={initialVolume}
          useValueLabel
          useButton={false}
          showIOSWarning={multitrackPlayerType === MULTITRACK_PLAYER_TYPE.default}
          onChange={handleInitialVolumeChange}
          />
      </FormItem>
    </Fragment>
  );
}

PlayerSettingsEditor.propTypes = {
  content: PropTypes.shape({
    multitrackPlayerType: PropTypes.oneOf(Object.values(MULTITRACK_PLAYER_TYPE)),
    showVideo: PropTypes.bool,
    aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
    posterImage: PropTypes.shape({
      sourceUrl: PropTypes.string
    }),
    width: PropTypes.number,
    initialVolume: PropTypes.number
  }).isRequired,
  useMultitrackPlayerType: PropTypes.bool,
  useShowVideo: PropTypes.bool,
  useAspectRatio: PropTypes.bool,
  usePosterImage: PropTypes.bool,
  useWidth: PropTypes.bool,
  disableVideo: PropTypes.bool,
  onContentChange: PropTypes.func.isRequired
};

PlayerSettingsEditor.defaultProps = {
  useMultitrackPlayerType: false,
  useShowVideo: false,
  useAspectRatio: false,
  usePosterImage: false,
  useWidth: false,
  disableVideo: false
};

export default memoAndTransformProps(PlayerSettingsEditor, ({
  onContentChange,
  ...rest
}) => ({
  onContentChange: useStableCallback(onContentChange),
  ...rest
}));

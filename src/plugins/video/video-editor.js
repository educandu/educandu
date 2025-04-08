import React from 'react';
import { Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import CopyrightNoticeEditor from '../../components/copyright-notice-editor.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import { FORM_ITEM_LAYOUT, MEDIA_ASPECT_RATIO, SOURCE_TYPE } from '../../domain/constants.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function VideoEditor({ content, onContentChanged }) {
  const { t } = useTranslation('video');

  const { sourceUrl, playbackRange, aspectRatio, posterImage, copyrightNotice, width, initialVolume } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value, playbackRange: [0, 1] });
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

  const handleCopyrightNoticeChange = newValue => {
    changeContent({ copyrightNotice: newValue });
  };

  const handleWidthChange = newValue => {
    changeContent({ width: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
  };

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">
        <FormItem label={t('common:url')} {...FORM_ITEM_LAYOUT}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput sourceUrl={sourceUrl} playbackRange={playbackRange} />
            <MediaRangeSelector sourceUrl={sourceUrl} range={playbackRange} onRangeChange={handlePlaybackRangeChange} />
          </div>
        </FormItem>
        <FormItem label={t('common:aspectRatio')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup defaultValue={MEDIA_ASPECT_RATIO.sixteenToNine} value={aspectRatio} onChange={handleAspectRatioChange}>
            {Object.values(MEDIA_ASPECT_RATIO).map(ratio => (
              <RadioButton key={ratio} value={ratio}>{ratio}</RadioButton>
            ))}
          </RadioGroup>
        </FormItem>
        <FormItem label={t('common:posterImageUrl')} {...FORM_ITEM_LAYOUT}>
          <UrlInput
            value={posterImage.sourceUrl}
            onChange={handlePosterImageSourceUrlChange}
            allowedSourceTypes={ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube)}
            />
        </FormItem>
        <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <CopyrightNoticeEditor value={copyrightNotice} sourceUrl={sourceUrl} onChange={handleCopyrightNoticeChange} />
        </FormItem>
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </FormItem>
        <FormItem label={t('common:initialVolume')} {...FORM_ITEM_LAYOUT} >
          <MediaVolumeSlider
            value={initialVolume}
            useValueLabel
            useButton={false}
            showIOSWarning
            onChange={handleInitialVolumeChange}
            />
        </FormItem>
      </Form>
    </div>
  );
}

VideoEditor.propTypes = {
  ...sectionEditorProps
};

export default VideoEditor;

import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import CopyrightNoticeEditor from '../../components/copyright-notice-editor.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';

const FormItem = Form.Item;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const { sourceUrl, playbackRange, copyrightNotice, initialVolume, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value, playbackRange: [0, 1] });
  };

  const handlePlaybackRangeChange = newValue => {
    changeContent({ playbackRange: newValue });
  };

  const handleCopyrightNoticeChange = newValue => {
    changeContent({ copyrightNotice: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput sourceUrl={sourceUrl} playbackRange={playbackRange} />
            <MediaRangeSelector sourceUrl={sourceUrl} range={playbackRange} onRangeChange={handlePlaybackRangeChange} />
          </div>
        </FormItem>
        <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <CopyrightNoticeEditor value={copyrightNotice} sourceUrl={sourceUrl} onChange={handleCopyrightNoticeChange} />
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
        <FormItem
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </FormItem>
      </Form>
    </div>
  );
}

AudioEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioEditor;

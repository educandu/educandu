import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';
import MediaVolumeSlider from '../../components/media-player/media-volume-slider.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';

const FormItem = Form.Item;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const { sourceUrl, playbackRange, copyrightNotice, initialVolume } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = (value, metadata) => {
    changeContent({
      sourceUrl: value,
      playbackRange: [0, 1],
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    });
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
  };

  const handleCopyrightNoticeChange = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
  };

  const handleInitialVolumeChange = newValue => {
    changeContent({ initialVolume: newValue });
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
        <Form.Item label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChange} />
        </Form.Item>
        <FormItem label={t('common:initialVolume')} {...FORM_ITEM_LAYOUT} >
          <MediaVolumeSlider
            value={initialVolume}
            useValueLabel
            useButton={false}
            onChange={handleInitialVolumeChange}
            />
        </FormItem>
      </Form>
    </div>
  );
}

AudioEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioEditor;

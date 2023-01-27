import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { isYoutubeSourceType } from '../../utils/source-utils.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';

const FormItem = Form.Item;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const { sourceUrl, playbackRange, copyrightNotice } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleSourceUrlChange = value => {
    changeContent({
      sourceUrl: value,
      playbackRange: [0, 1],
      copyrightNotice: isYoutubeSourceType(value)
        ? t('common:youtubeCopyrightNotice', { link: value })
        : ''
    });
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
  };

  const handleCopyrightNoticeChange = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
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
      </Form>
    </div>
  );
}

AudioEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioEditor;

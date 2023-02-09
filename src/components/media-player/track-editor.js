import { Form, Input } from 'antd';
import PropTypes from 'prop-types';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import MediaRangeSelector from './media-range-selector.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import MediaRangeReadonlyInput from './media-range-readonly-input.js';
import { createCopyrightForSourceMetadata } from '../../utils/source-utils.js';

const FormItem = Form.Item;

function TrackEditor({ content, onContentChanged, usePlaybackRange }) {
  const { t } = useTranslation('trackEditor');

  const { name, sourceUrl, playbackRange, copyrightNotice } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleNameChange = event => {
    changeContent({ name: event.target.value });
  };

  const handleSourceUrlChange = (value, metadata) => {
    const newContent = {
      sourceUrl: value,
      playbackRange: [0, 1],
      copyrightNotice: createCopyrightForSourceMetadata(metadata, t)
    };

    changeContent(newContent);
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  return (
    <Fragment>
      <FormItem label={t('common:name')} {...FORM_ITEM_LAYOUT}>
        <Input value={name} onChange={handleNameChange} />
      </FormItem>
      <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      {!!usePlaybackRange && (
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput sourceUrl={sourceUrl} playbackRange={playbackRange} />
            <MediaRangeSelector sourceUrl={sourceUrl} range={playbackRange} onRangeChange={handlePlaybackRangeChange} />
          </div>
        </FormItem>
      )}
      <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

TrackEditor.propTypes = {
  content: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number),
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired,
  usePlaybackRange: PropTypes.bool
};

TrackEditor.defaultProps = {
  usePlaybackRange: false
};

export default TrackEditor;

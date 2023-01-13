import React from 'react';
import { Form } from 'antd';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { analyzeMediaUrl } from '../../utils/media-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { FORM_ITEM_LAYOUT, RESOURCE_TYPE } from '../../domain/constants.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';

const FormItem = Form.Item;

function MatchingCardsTileEditor({ text, sourceUrl, playbackRange, onTextChange, onSourceUrlChange, onPlaybackRangeChange }) {
  const { t } = useTranslation('matchingCards');

  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };
  const isMediaSourceType = resourceType === RESOURCE_TYPE.audio || resourceType === RESOURCE_TYPE.video;

  return (
    <div className="MatchingCardsTileEditor">
      <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={text} onChange={onTextChange} />
      </FormItem>
      <FormItem label={t('url')} {...FORM_ITEM_LAYOUT}>
        <UrlInput value={sourceUrl} onChange={onSourceUrlChange} />
      </FormItem>
      {!!isMediaSourceType && (
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput sourceUrl={sourceUrl} playbackRange={playbackRange} />
            <MediaRangeSelector sourceUrl={sourceUrl} range={playbackRange} onRangeChange={onPlaybackRangeChange} />
          </div>
        </FormItem>
      )}
    </div>
  );
}

MatchingCardsTileEditor.propTypes = {
  text: PropTypes.string,
  sourceUrl: PropTypes.string,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  onTextChange: PropTypes.func.isRequired,
  onSourceUrlChange: PropTypes.func.isRequired,
  onPlaybackRangeChange: PropTypes.func.isRequired
};

MatchingCardsTileEditor.defaultProps = {
  text: '',
  sourceUrl: '',
  playbackRange: [0, 1]
};

export default MatchingCardsTileEditor;

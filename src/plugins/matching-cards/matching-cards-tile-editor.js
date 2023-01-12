import { Form } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { handleError } from '../../ui/error-helper.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { analyzeMediaUrl, getMediaInformation } from '../../utils/media-utils.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import { FORM_ITEM_LAYOUT, RESOURCE_TYPE, SOURCE_TYPE } from '../../domain/constants.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';
import { getAccessibleUrl, getSourceType, isInternalSourceType } from '../../utils/source-utils.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function MatchingCardsTileEditor({ text, sourceUrl, playbackRange, onTextChange, onSourceUrlChange, onPlaybackRangeChange }) {
  const { t } = useTranslation('matchingCards');
  const clientConfig = useService(ClientConfig);

  const [sourceDuration, setSourceDuration] = useState(0);

  const { resourceType } = sourceUrl ? analyzeMediaUrl(sourceUrl) : { resourceType: RESOURCE_TYPE.none };
  const isMediaSourceType = resourceType === RESOURCE_TYPE.audio || resourceType === RESOURCE_TYPE.video;

  const determineMediaInformationFromUrl = async url => {
    const mediaInfo = await getMediaInformation({ url, playbackRange, cdnRootUrl: clientConfig.cdnRootUrl });
    setSourceDuration(mediaInfo.duration);

    return mediaInfo;
  };

  useOnComponentMounted(async () => {
    if (isMediaSourceType) {
      await determineMediaInformationFromUrl(sourceUrl);
    }
  });

  const handleSourceUrlChange = async newSourceUrl => {
    if (!isMediaSourceType) {
      onSourceUrlChange(newSourceUrl);
      return;
    }

    const { sanitizedUrl, error } = await determineMediaInformationFromUrl(newSourceUrl);

    const newSourceType = getSourceType({ url: newSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewSourceTypeInternal = isInternalSourceType({ url: newSourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    onSourceUrlChange(newSourceType === SOURCE_TYPE.unsupported || isNewSourceTypeInternal ? newSourceUrl : sanitizedUrl);

    if (error) {
      handleError({ error, logger, t });
    }
  };

  return (
    <div className="MatchingCardsTileEditor">
      <FormItem label={t('common:text')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={text} onChange={onTextChange} />
      </FormItem>
      <FormItem label={t('url')} {...FORM_ITEM_LAYOUT}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      {!!isMediaSourceType && (
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput playbackRange={playbackRange} sourceDuration={sourceDuration} />
            <MediaRangeSelector
              range={playbackRange}
              onRangeChange={onPlaybackRangeChange}
              sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              />
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

import { Form } from 'antd';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { handleError } from '../../ui/error-helper.js';
import { useOnComponentMounted } from '../../ui/hooks.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getMediaInformation } from '../../utils/media-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import MediaRangeSelector from '../../components/media-player/media-range-selector.js';
import MediaRangeReadonlyInput from '../../components/media-player/media-range-readonly-input.js';
import { getAccessibleUrl, getSourceType, isInternalSourceType } from '../../utils/source-utils.js';
import { getUrlValidationStatus, URL_VALIDATION_STATUS, validateUrl } from '../../ui/validation.js';

const FormItem = Form.Item;

const logger = new Logger(import.meta.url);

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const clientConfig = useService(ClientConfig);

  const [sourceDuration, setSourceDuration] = useState(0);
  const { sourceUrl, playbackRange, copyrightNotice } = content;

  const determineMediaInformationFromUrl = async url => {
    const mediaInfo = await getMediaInformation({ url, playbackRange, cdnRootUrl: clientConfig.cdnRootUrl });
    setSourceDuration(mediaInfo.duration);

    return mediaInfo;
  };

  useOnComponentMounted(async () => {
    await determineMediaInformationFromUrl(sourceUrl);
  });

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid = !isNewSourceTypeInternal && getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = async url => {
    const { sanitizedUrl, range, error } = await determineMediaInformationFromUrl(url);

    const newSourceType = getSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });
    const isNewSourceTypeInternal = isInternalSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });

    const newCopyrightNotice = newSourceType === SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: url })
      : '';

    changeContent({
      sourceUrl: newSourceType === SOURCE_TYPE.unsupported || isNewSourceTypeInternal ? url : sanitizedUrl,
      playbackRange: range,
      copyrightNotice: newCopyrightNotice
    });

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handlePlaybackRangeChange = newRange => {
    changeContent({ playbackRange: newRange });
  };

  const handleCopyrightNoticeChange = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
  };

  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <FormItem label={t('common:playbackRange')} {...FORM_ITEM_LAYOUT}>
          <div className="u-input-and-button">
            <MediaRangeReadonlyInput playbackRange={playbackRange} sourceDuration={sourceDuration} />
            <MediaRangeSelector
              range={playbackRange}
              onRangeChange={handlePlaybackRangeChange}
              sourceUrl={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
              />
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

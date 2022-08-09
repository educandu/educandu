import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import Logger from '../common/logger.js';
import { Form, Input, Radio } from 'antd';
import validation from '../ui/validation.js';
import { useTranslation } from 'react-i18next';
import MarkdownInput from './markdown-input.js';
import ResourcePicker from './resource-picker.js';
import { useService } from './container-context.js';
import { handleError } from '../ui/error-helper.js';
import ClientConfig from '../bootstrap/client-config.js';
import { getMediaInformation } from '../utils/media-utils.js';
import { CDN_URL_PREFIX, MEDIA_SOURCE_TYPE } from '../domain/constants.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../utils/storage-utils.js';

const logger = new Logger(import.meta.url);

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

function SecondaryTrackEditor({ content, onContentChanged }) {
  const { t } = useTranslation('');
  const clientConfig = useService(ClientConfig);
  const { name, sourceType, sourceUrl, copyrightNotice } = content;

  const determineMediaInformationFromUrl = async url => {
    const result = await getMediaInformation({
      t,
      url,
      sourceType,
      playbackRange: [0, 1],
      cdnRootUrl: clientConfig.cdnRootUrl
    });
    return result;
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl
      = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleNameChange = event => {
    changeContent({ name: event.target.value });
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      copyrightNotice: ''
    });
  };

  const handleSourceUrlChangeComplete = async value => {
    const { sanitizedUrl, error } = await determineMediaInformationFromUrl(value);

    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    changeContent({
      sourceUrl: sourceType !== MEDIA_SOURCE_TYPE.internal ? sanitizedUrl : value,
      copyrightNotice: newCopyrightNotice
    });

    if (error) {
      handleError({ error, logger, t });
    }
  };

  const handleSourceUrlChange = event => {
    changeContent({ sourceUrl: event.target.value });
  };

  const handleSourceUrlBlur = event => {
    handleSourceUrlChangeComplete(event.target.value);
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  return (
    <Fragment>
      <FormItem label={t('common:name')} {...formItemLayout}>
        <Input value={name} onChange={handleNameChange} />
      </FormItem>
      <FormItem label={t('common:source')} {...formItemLayout}>
        <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
          <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
          <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
          <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
        </RadioGroup>
      </FormItem>
      {sourceType === MEDIA_SOURCE_TYPE.external && (
      <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
        <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
      </FormItem>
      )}
      {sourceType === MEDIA_SOURCE_TYPE.internal && (
      <FormItem label={t('common:internalUrl')} {...formItemLayout}>
        <div className="u-input-and-button">
          <Input
            addonBefore={CDN_URL_PREFIX}
            value={sourceUrl}
            onChange={handleSourceUrlChange}
            onBlur={handleSourceUrlBlur}
            />
          <ResourcePicker
            url={storageLocationPathToUrl(sourceUrl)}
            onUrlChange={url => handleSourceUrlChangeComplete(urlToStorageLocationPath(url))}
            />
        </div>
      </FormItem>
      )}
      {sourceType === MEDIA_SOURCE_TYPE.youtube && (
      <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
        <Input value={sourceUrl} onChange={handleSourceUrlChange} onBlur={handleSourceUrlBlur} />
      </FormItem>
      )}
      <FormItem label={t('common:copyrightNotice')} {...formItemLayout}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

SecondaryTrackEditor.propTypes = {
  content: PropTypes.shape({
    name: PropTypes.string,
    sourceType: PropTypes.oneOf(Object.values(MEDIA_SOURCE_TYPE)),
    sourceUrl: PropTypes.string,
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired
};

export default SecondaryTrackEditor;

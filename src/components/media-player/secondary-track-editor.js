import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import UrlInput from '../url-input.js';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownInput from '../markdown-input.js';
import { useService } from '../container-context.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { isInternalSourceType, isYoutubeSourceType } from '../../utils/source-utils.js';
import { getUrlValidationStatus, URL_VALIDATION_STATUS, validateUrl } from '../../ui/validation.js';

const FormItem = Form.Item;

function SecondaryTrackEditor({ content, onContentChanged }) {
  const { t } = useTranslation('');
  const clientConfig = useService(ClientConfig);
  const { name, sourceUrl, copyrightNotice } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalidSourceUrl = !isNewSourceTypeInternal && getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleNameChange = event => {
    changeContent({ name: event.target.value });
  };

  const handleSourceUrlChange = value => {
    changeContent({
      sourceUrl: value,
      copyrightNotice: isYoutubeSourceType(value)
        ? t('common:youtubeCopyrightNotice', { link: value })
        : ''
    });
  };

  const handleCopyrightNoticeChanged = event => {
    changeContent({ copyrightNotice: event.target.value });
  };

  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <Fragment>
      <FormItem label={t('common:name')} {...FORM_ITEM_LAYOUT}>
        <Input value={name} onChange={handleNameChange} />
      </FormItem>
      <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
        <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
      </FormItem>
      <FormItem label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
        <MarkdownInput value={copyrightNotice} onChange={handleCopyrightNoticeChanged} />
      </FormItem>
    </Fragment>
  );
}

SecondaryTrackEditor.propTypes = {
  content: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    copyrightNotice: PropTypes.string
  }).isRequired,
  onContentChanged: PropTypes.func.isRequired
};

export default SecondaryTrackEditor;

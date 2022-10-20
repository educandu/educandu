import React from 'react';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { getSourceType, isInternalSourceType } from '../../utils/source-utils.js';

const FormItem = Form.Item;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const clientConfig = useService(ClientConfig);

  const { sourceUrl, copyrightNotice } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid = !isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = url => {
    const newSourceType = getSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl });

    const newCopyrightNotice = newSourceType === SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: url })
      : '';

    changeContent({ sourceUrl: url, copyrightNotice: newCopyrightNotice });
  };

  const handleCopyrightNoticeChange = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
  };

  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
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

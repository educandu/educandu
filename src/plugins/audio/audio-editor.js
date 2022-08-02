import React from 'react';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import MarkdownInput from '../../components/markdown-input.js';
import ResourcePicker from '../../components/resource-picker.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { CDN_URL_PREFIX, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');

  const { sourceType, sourceUrl, copyrightNotice } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl = newContent.sourceType !== MEDIA_SOURCE_TYPE.internal && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeValueChange = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '', copyrightNotice: '' });
  };

  const handleSourceUrlValueChange = event => {
    const { value } = event.target;
    const newCopyrightNotice = sourceType === MEDIA_SOURCE_TYPE.youtube
      ? t('common:youtubeCopyrightNotice', { link: value })
      : copyrightNotice;

    changeContent({ sourceUrl: value, copyrightNotice: newCopyrightNotice });
  };

  const handleInternalUrlFileNameChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleCopyrightNoticeChange = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeValueChange}>
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === 'external' && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
          </FormItem>
        )}
        {sourceType === 'internal' && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div className="u-input-and-button">
              <Input
                addonBefore={CDN_URL_PREFIX}
                value={sourceUrl}
                onChange={handleSourceUrlValueChange}
                />
              <ResourcePicker
                url={storageLocationPathToUrl(sourceUrl)}
                onUrlChange={url => handleInternalUrlFileNameChange(urlToStorageLocationPath(url))}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
          </FormItem>
        )}
        <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
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

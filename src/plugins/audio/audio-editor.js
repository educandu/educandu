import React from 'react';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function AudioEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audio');
  const clientConfig = useService(ClientConfig);

  const { sourceType, sourceUrl, text } = content;

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
    changeContent({ sourceType: value, sourceUrl: '' });
  };

  const handleSourceUrlValueChange = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlFileNameChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleCurrentEditorValueChange = event => {
    const newValue = event.target.value;
    changeContent({ text: newValue });
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
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleSourceUrlValueChange}
                />
              <StorageFilePicker
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChange}
                />
            </div>
          </FormItem>
        )}
        {sourceType === MEDIA_SOURCE_TYPE.youtube && (
          <FormItem label={t('common:youtubeUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlValueChange} />
          </FormItem>
        )}
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <MarkdownInput value={text} onChange={handleCurrentEditorValueChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

AudioEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioEditor;

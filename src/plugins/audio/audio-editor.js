import React from 'react';
import { Form, Input, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import StorageFilePicker from '../../components/storage-file-picker.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
const { TextArea } = Input;

function AudioEditor({ content, onContentChanged, publicStorage, privateStorage }) {
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

  const handleExternalUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlValueChanged = e => {
    changeContent({ sourceUrl: e.target.value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value });
  };

  const handleSourceTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '' });
  };
  const handleCurrentEditorValueChanged = event => {
    const newValue = event.target.value;
    changeContent({ text: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeValueChanged}>
            <RadioButton value={MEDIA_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
            <RadioButton value={MEDIA_SOURCE_TYPE.youtube}>{t('common:youtube')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === 'external' && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleExternalUrlValueChanged} />
          </FormItem>
        )}
        {sourceType === 'internal' && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleInternalUrlValueChanged}
                />
              <StorageFilePicker
                publicStorage={publicStorage}
                privateStorage={privateStorage}
                fileName={sourceUrl}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCurrentEditorValueChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

AudioEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioEditor;

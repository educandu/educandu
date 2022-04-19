import React from 'react';
import { Form, Input, Radio } from 'antd';
import { SOURCE_TYPE } from './constants.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import ClientConfig from '../../bootstrap/client-config.js';
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

  const { type, url, text } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleExternalUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ url: value });
  };

  const handleInternalUrlValueChanged = e => {
    changeContent({ url: e.target.value });
  };

  const handleInternalUrlFileNameChanged = value => {
    changeContent({ url: value });
  };

  const handleTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ type: value, url: '' });
  };
  const handleCurrentEditorValueChanged = event => {
    const newValue = event.target.value;
    changeContent({ text: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('source')} {...formItemLayout}>
          <RadioGroup value={type} onChange={handleTypeValueChanged}>
            <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('internalCdn')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {type === 'external' && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(url, t)} hasFeedback>
            <Input value={url} onChange={handleExternalUrlValueChanged} />
          </FormItem>
        )}
        {type === 'internal' && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={url}
                onChange={handleInternalUrlValueChanged}
                />
              <StorageFilePicker
                publicStorage={publicStorage}
                privateStorage={privateStorage}
                fileName={url}
                onFileNameChanged={handleInternalUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
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

import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import React, { Fragment, useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { Button, Divider, Form, Input, Radio, Tooltip } from 'antd';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { CDN_URL_PREFIX, IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import AudioWaveformGeneratorDialog from './audio-waveform-generator-dialog.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

const formItemLayoutWithoutLabel = {
  wrapperCol: { span: 14, offset: 4 }
};

function AudioWaveformEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audioWaveform');
  const [isWaveformGeneratorDialogVisible, setIsWaveformGeneratorDialogVisible] = useState(false);

  const { sourceType, sourceUrl, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl = newContent.sourceType !== IMAGE_SOURCE_TYPE.internal && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '' });
  };

  const handleSourceUrlChange = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalUrlChange = url => {
    changeContent({ sourceUrl: urlToStorageLocationPath(url) });
  };

  const handleCreateWaveform = () => {
    setIsWaveformGeneratorDialogVisible(true);
  };

  const handleWaveformGeneratorDialogSelect = newInternalSourceUrl => {
    setIsWaveformGeneratorDialogVisible(false);
    changeContent({
      sourceType: IMAGE_SOURCE_TYPE.internal,
      sourceUrl: urlToStorageLocationPath(newInternalSourceUrl)
    });
  };

  const handleWaveformGeneratorDialogCancel = () => {
    setIsWaveformGeneratorDialogVisible(false);
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  return (
    <div>
      <Form layout="horizontal">
        <Divider plain>{t('chooseImageDividerText')}</Divider>
        <FormItem label={t('common:source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeChange}>
            <RadioButton value={IMAGE_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
            <RadioButton value={IMAGE_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === 'external' && (
          <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleSourceUrlChange} />
          </FormItem>
        )}
        {sourceType === 'internal' && (
          <FormItem label={t('common:internalUrl')} {...formItemLayout}>
            <div className="u-input-and-button">
              <Input
                addonBefore={CDN_URL_PREFIX}
                value={sourceUrl}
                onChange={handleSourceUrlChange}
                />
              <ResourcePicker
                url={storageLocationPathToUrl(sourceUrl)}
                onUrlChange={handleInternalUrlChange}
                />
            </div>
          </FormItem>
        )}
        <Divider plain>{t('generateImageDividerText')}</Divider>
        <FormItem {...formItemLayoutWithoutLabel}>
          <Button type="primary" onClick={handleCreateWaveform}>
            {t('Wellenform aus Audio-Datei erstellen')}
          </Button>
        </FormItem>
        <Divider plain>{t('generalSettingsDividerText')}</Divider>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
      <AudioWaveformGeneratorDialog
        visible={isWaveformGeneratorDialogVisible}
        onSelect={handleWaveformGeneratorDialogSelect}
        onCancel={handleWaveformGeneratorDialogCancel}
        />
    </div>
  );
}

AudioWaveformEditor.propTypes = {
  ...sectionEditorProps
};

export default AudioWaveformEditor;

import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import React, { Fragment, useState } from 'react';
import { range } from '../../utils/array-utils.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import ColorPicker from '../../components/color-picker.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { getDefaultInteractivityConfig } from './audio-waveform-utils.js';
import { Button, Divider, Form, Input, Radio, Slider, Tooltip } from 'antd';
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

const opacityWhenResolvedSliderMarks = range({ from: 0, to: 100, step: 25 })
  .reduce((all, val) => ({ ...all, [val]: <span>{val}%</span> }), {});

const opacityWhenResolvedTipFormatter = val => `${val}%`;

function AudioWaveformEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audioWaveform');
  const [isWaveformGeneratorDialogVisible, setIsWaveformGeneratorDialogVisible] = useState(false);

  const { sourceType, sourceUrl, width, displayMode, interactivityConfig } = content;
  const { penColor, baselineColor, backgroundColor, opacityWhenResolved } = interactivityConfig;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl = newContent.sourceType !== IMAGE_SOURCE_TYPE.internal && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeChange = event => {
    changeContent({ sourceType: event.target.value, sourceUrl: '' });
  };

  const handleSourceUrlChange = event => {
    changeContent({ sourceUrl: event.target.value });
  };

  const handleInternalUrlChange = url => {
    changeContent({ sourceUrl: urlToStorageLocationPath(url) });
  };

  const handleGenerateWaveform = () => {
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

  const handleDisplayModeChange = event => {
    changeContent({
      displayMode: event.target.value,
      interactivityConfig: getDefaultInteractivityConfig()
    });
  };

  const handlePenColorChange = color => {
    changeContent({ interactivityConfig: { ...interactivityConfig, penColor: color } });
  };

  const handleBaselineColorChange = color => {
    changeContent({ interactivityConfig: { ...interactivityConfig, baselineColor: color } });
  };

  const handleBackgroundColorChange = color => {
    changeContent({ interactivityConfig: { ...interactivityConfig, backgroundColor: color } });
  };

  const handleOpacityWhenResolvedChange = value => {
    changeContent({ interactivityConfig: { ...interactivityConfig, opacityWhenResolved: value / 100 } });
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
          <Button type="primary" onClick={handleGenerateWaveform}>
            {t('generateWaveformFromAudioFile')}
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
        <FormItem label={t('common:displayMode')} {...formItemLayout}>
          <RadioGroup value={displayMode} onChange={handleDisplayModeChange}>
            <RadioButton value={DISPLAY_MODE.static}>{t('displayMode_static')}</RadioButton>
            <RadioButton value={DISPLAY_MODE.interactive}>{t('displayMode_interactive')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {displayMode === DISPLAY_MODE.interactive && (
          <div className="Panel">
            <div className="Panel-content">
              <FormItem label={t('penColor')} {...formItemLayout}>
                <ColorPicker color={penColor} onChange={handlePenColorChange} />
              </FormItem>
              <FormItem label={t('baselineColor')} {...formItemLayout}>
                <ColorPicker color={baselineColor} onChange={handleBaselineColorChange} />
              </FormItem>
              <FormItem label={t('backgroundColor')} {...formItemLayout}>
                <ColorPicker color={backgroundColor} onChange={handleBackgroundColorChange} />
              </FormItem>
              <FormItem label={t('opacityWhenResolved')} {...formItemLayout}>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  marks={opacityWhenResolvedSliderMarks}
                  value={opacityWhenResolved * 100}
                  onChange={handleOpacityWhenResolvedChange}
                  tipFormatter={opacityWhenResolvedTipFormatter}
                  />
              </FormItem>
            </div>
          </div>
        )}
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

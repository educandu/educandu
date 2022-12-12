import React, { useState } from 'react';
import Info from '../../components/info.js';
import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import { Button, Divider, Form, Radio } from 'antd';
import UrlInput from '../../components/url-input.js';
import StepSlider from '../../components/step-slider.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { getDefaultInteractivityConfig } from './audio-waveform-utils.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import AudioWaveformGeneratorDialog from './audio-waveform-generator-dialog.js';
import { getPortableUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_WITHOUT_LABEL, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

function AudioWaveformEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const formatPercentage = usePercentageFormat();
  const [isWaveformGeneratorDialogOpen, setIsWaveformGeneratorDialogOpen] = useState(false);

  const { sourceUrl, width, displayMode, interactivityConfig } = content;
  const { penColor, baselineColor, backgroundColor, opacityWhenResolved } = interactivityConfig;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isNewSourceTypeInternal = isInternalSourceType({ url: newContent.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const isInvalid = !isNewSourceTypeInternal && validation.getUrlValidationStatus(newContent.sourceUrl) === URL_VALIDATION_STATUS.error;

    onContentChanged(newContent, isInvalid);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleGenerateWaveform = () => {
    setIsWaveformGeneratorDialogOpen(true);
  };

  const handleWaveformGeneratorDialogSelect = selectedUrl => {
    setIsWaveformGeneratorDialogOpen(false);
    changeContent({ sourceUrl: getPortableUrl({ url: selectedUrl, cdnRootUrl: clientConfig.cdnRootUrl }) });
  };

  const handleWaveformGeneratorDialogCancel = () => {
    setIsWaveformGeneratorDialogOpen(false);
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  const handleDisplayModeChange = event => {
    changeContent({ displayMode: event.target.value, interactivityConfig: getDefaultInteractivityConfig() });
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
    changeContent({ interactivityConfig: { ...interactivityConfig, opacityWhenResolved: value } });
  };

  const allowedSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);
  const validationProps = isInternalSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })
    ? {}
    : validation.validateUrl(sourceUrl, t, { allowEmpty: true });

  return (
    <div>
      <Form layout="horizontal">
        <Divider plain>{t('chooseImageDividerText')}</Divider>
        <FormItem {...FORM_ITEM_LAYOUT} {...validationProps} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>
        <Divider plain>{t('generateImageDividerText')}</Divider>
        <FormItem {...FORM_ITEM_LAYOUT_WITHOUT_LABEL}>
          <Button type="primary" onClick={handleGenerateWaveform}>
            {t('generateWaveformFromAudioFile')}
          </Button>
        </FormItem>
        <Divider plain>{t('generalSettingsDividerText')}</Divider>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <FormItem label={t('common:displayMode')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={displayMode} onChange={handleDisplayModeChange}>
            <RadioButton value={DISPLAY_MODE.static}>{t('displayMode_static')}</RadioButton>
            <RadioButton value={DISPLAY_MODE.interactive}>{t('displayMode_interactive')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {displayMode === DISPLAY_MODE.interactive && (
          <div className="Panel">
            <div className="Panel-content">
              <FormItem label={t('penColor')} {...FORM_ITEM_LAYOUT}>
                <ColorPicker color={penColor} onChange={handlePenColorChange} />
              </FormItem>
              <FormItem label={t('baselineColor')} {...FORM_ITEM_LAYOUT}>
                <ColorPicker color={baselineColor} onChange={handleBaselineColorChange} />
              </FormItem>
              <FormItem label={t('backgroundColor')} {...FORM_ITEM_LAYOUT}>
                <ColorPicker color={backgroundColor} onChange={handleBackgroundColorChange} />
              </FormItem>
              <FormItem label={t('opacityWhenResolved')} {...FORM_ITEM_LAYOUT}>
                <StepSlider
                  min={0}
                  max={1}
                  step={0.01}
                  labelsStep={0.25}
                  value={opacityWhenResolved}
                  formatter={formatPercentage}
                  onChange={handleOpacityWhenResolvedChange}
                  />
              </FormItem>
            </div>
          </div>
        )}
      </Form>
      <AudioWaveformGeneratorDialog
        isOpen={isWaveformGeneratorDialogOpen}
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

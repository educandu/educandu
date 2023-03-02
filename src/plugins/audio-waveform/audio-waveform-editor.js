import { Button, Form, Radio } from 'antd';
import Info from '../../components/info.js';
import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import UrlInput from '../../components/url-input.js';
import StepSlider from '../../components/step-slider.js';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getPortableUrl } from '../../utils/source-utils.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import { getDefaultInteractivityConfig } from './audio-waveform-utils.js';
import AudioWaveformGeneratorDialog from './audio-waveform-generator-dialog.js';

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
    onContentChanged(newContent);
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

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">

        <FormItem {...FORM_ITEM_LAYOUT} label={<Info tooltip={t('createImageLabelInfo')}>{t('common:create')}</Info>}>
          <Button type="primary" onClick={handleGenerateWaveform}>
            {t('createImageButton')}
          </Button>
        </FormItem>

        <FormItem {...FORM_ITEM_LAYOUT} label={t('imageUrl')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>

        <FormItem {...FORM_ITEM_LAYOUT} label={<Info tooltip={t('displayModeInfo')}>{t('common:displayMode')}</Info>}>
          <RadioGroup value={displayMode} onChange={handleDisplayModeChange}>
            <RadioButton value={DISPLAY_MODE.static}>{t('displayMode_static')}</RadioButton>
            <RadioButton value={DISPLAY_MODE.interactive}>{t('displayMode_interactive')}</RadioButton>
          </RadioGroup>
        </FormItem>

        {displayMode === DISPLAY_MODE.interactive && (
          <Fragment>
            <FormItem label={t('penColor')} {...FORM_ITEM_LAYOUT}>
              <ColorPicker color={penColor} onChange={handlePenColorChange} />
            </FormItem>
            <FormItem label={t('baselineColor')} {...FORM_ITEM_LAYOUT}>
              <ColorPicker color={baselineColor} onChange={handleBaselineColorChange} />
            </FormItem>
            <FormItem label={t('backgroundColor')} {...FORM_ITEM_LAYOUT}>
              <ColorPicker color={backgroundColor} onChange={handleBackgroundColorChange} />
            </FormItem>
            <FormItem {...FORM_ITEM_LAYOUT} label={<Info tooltip={t('opacityWhenResolvedInfo')}>{t('opacityWhenResolved')}</Info>}>
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
          </Fragment>
        )}

        <Form.Item {...FORM_ITEM_LAYOUT} label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}>
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
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

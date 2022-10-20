import { DISPLAY_MODE } from './constants.js';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import ColorPicker from '../../components/color-picker.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { ensureIsExcluded, range } from '../../utils/array-utils.js';
import { Button, Divider, Form, Radio, Slider, Tooltip } from 'antd';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { getDefaultInteractivityConfig } from './audio-waveform-utils.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import AudioWaveformGeneratorDialog from './audio-waveform-generator-dialog.js';
import { getPersistableUrl, isInternalSourceType } from '../../utils/source-utils.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_WITHOUT_LABEL, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const opacityWhenResolvedSliderMarks = range({ from: 0, to: 100, step: 25 })
  .reduce((all, val) => ({ ...all, [val]: <span>{val}%</span> }), {});

const opacityWhenResolvedTipFormatter = val => `${val}%`;

function AudioWaveformEditor({ content, onContentChanged }) {
  const { t } = useTranslation('audioWaveform');
  const clientConfig = useService(ClientConfig);
  const [isWaveformGeneratorDialogVisible, setIsWaveformGeneratorDialogVisible] = useState(false);

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
    setIsWaveformGeneratorDialogVisible(true);
  };

  const handleWaveformGeneratorDialogSelect = selectedUrl => {
    setIsWaveformGeneratorDialogVisible(false);
    changeContent({ sourceUrl: getPersistableUrl({ url: selectedUrl, cdnRootUrl: clientConfig.cdnRootUrl }) });
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
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
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

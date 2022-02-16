import React from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { Form, Input, Radio, InputNumber } from 'antd';
import ClientConfig from '../../../bootstrap/client-config.js';
import CdnFilePicker from '../../../components/cdn-file-picker.js';
import { useService } from '../../../components/container-context.js';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import { EFFECT_TYPE, SOURCE_TYPE, ORIENTATION } from '../constants.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

function ImageEditor({ content, onContentChanged, publicStorage }) {
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);

  const { sourceType, sourceUrl, maxWidth, text, effect } = content;
  const effectType = effect?.type || EFFECT_TYPE.none;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleEffectExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleEffectInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleInternalSourceUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value });
  };

  const handleEffectInternalSourceUrlFileNameChanged = value => {
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleSourceTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '' });
  };

  const handleEffectSourceTypeValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceType: value, sourceUrl: '' };
    changeContent({ effect: newEffect });
  };

  const handleMaxWidthValueChanged = value => {
    changeContent({ maxWidth: value });
  };

  const handleCopyrightInfoValueChanged = event => {
    const { value } = event.target;
    changeContent({ text: value });
  };

  const handleOrientationValueChanged = event => {
    const { value } = event.target;
    const newEffect = { effect, orientation: value };
    changeContent({ effect: newEffect });
  };

  const handleEffectOptionChange = event => {
    const { value } = event.target;

    const baseEffect = {
      sourceType: effect?.sourceType || SOURCE_TYPE.internal,
      sourceUrl: effect?.sourceUrl || '',
      text: effect?.text || ''
    };

    switch (value) {
      case EFFECT_TYPE.reveal:
        changeContent({
          effect: {
            ...baseEffect,
            type: EFFECT_TYPE.reveal,
            startPosition: 10,
            orientation: ORIENTATION.horizontal
          }
        });
        break;
      case EFFECT_TYPE.hover:
        changeContent({
          effect: {
            ...baseEffect,
            type: EFFECT_TYPE.hover
          }
        });
        break;
      case EFFECT_TYPE.none:
      default:
        changeContent({ effect: null });
    }
  };

  const handleEffectCopyrightInfoValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, text: value };
    changeContent({ effect: newEffect });
  };

  const handleStartPositionValueChanged = newPosition => {
    const newEffect = { ...effect, startPosition: Math.max(0, Math.min(100, newPosition)) };
    changeContent({ effect: newEffect });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem label={t('source')} {...formItemLayout}>
          <RadioGroup value={sourceType} onChange={handleSourceTypeValueChanged}>
            <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
            <RadioButton value={SOURCE_TYPE.internal}>{t('internalCdn')}</RadioButton>
          </RadioGroup>
        </FormItem>
        {sourceType === SOURCE_TYPE.external && (
          <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(sourceUrl, t)} hasFeedback>
            <Input value={sourceUrl} onChange={handleExternalSourceUrlValueChanged} />
          </FormItem>
        )}
        {sourceType === SOURCE_TYPE.internal && (
          <FormItem label={t('internalUrl')} {...formItemLayout}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                addonBefore={`${clientConfig.cdnRootUrl}/`}
                value={sourceUrl}
                onChange={handleInternalSourceUrlValueChanged}
                />
              <CdnFilePicker
                publicStorage={publicStorage}
                fileName={sourceUrl}
                onFileNameChanged={handleInternalSourceUrlFileNameChanged}
                />
            </div>
          </FormItem>
        )}
        <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
        <Form.Item label={t('effectTypeLabel')} {...formItemLayout}>
          <RadioGroup value={effectType} onChange={handleEffectOptionChange}>
            <RadioButton value={EFFECT_TYPE.none}>{t('noneOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.hover}>{t('hoverOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.reveal}>{t('revealOption')}</RadioButton>
          </RadioGroup>
        </Form.Item>
        {effect && (
          <div className="Panel">
            <div className="Panel-content Panel-content--darker">
              <FormItem label={t('source')} {...formItemLayout}>
                <RadioGroup value={effect.sourceType} onChange={handleEffectSourceTypeValueChanged}>
                  <RadioButton value="external">{t('externalLink')}</RadioButton>
                  <RadioButton value="internal">{t('internalCdn')}</RadioButton>
                </RadioGroup>
              </FormItem>
              {effect.sourceType === SOURCE_TYPE.external && (
                <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(effect.sourceUrl, t)} hasFeedback>
                  <Input value={effect.sourceUrl} onChange={handleEffectExternalSourceUrlValueChanged} />
                </FormItem>
              )}
              {effect.sourceType === SOURCE_TYPE.internal && (
                <FormItem label={t('internalUrl')} {...formItemLayout}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      addonBefore={`${clientConfig.cdnRootUrl}/`}
                      value={effect.sourceUrl}
                      onChange={handleEffectInternalSourceUrlValueChanged}
                      />
                    <CdnFilePicker
                      publicStorage={publicStorage}
                      fileName={effect.sourceUrl}
                      onFileNameChanged={handleEffectInternalSourceUrlFileNameChanged}
                      />
                  </div>
                </FormItem>
              )}
              <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
                <TextArea value={effect.text} onChange={handleEffectCopyrightInfoValueChanged} autoSize={{ minRows: 3 }} />
              </Form.Item>
              {effect.type === EFFECT_TYPE.reveal && (
                <div>
                  <FormItem label={t('startPosition')} {...formItemLayout}>
                    <InputNumber
                      defaultValue={effect.startPosition}
                      min={0}
                      max={100}
                      formatter={value => `${value}%`}
                      parser={value => value.replace('%', '')}
                      onChange={handleStartPositionValueChanged}
                      />
                  </FormItem>
                  <FormItem label={t('orientationLabel')} {...formItemLayout}>
                    <RadioGroup value={effect.orientation} onChange={handleOrientationValueChanged}>
                      <RadioButton value={ORIENTATION.horizontal}>{t('orientationOptionHorizontal')}</RadioButton>
                      <RadioButton value={ORIENTATION.vertical}>{t('orientationOptionVertical')}</RadioButton>
                    </RadioGroup>
                  </FormItem>
                </div>
              )}
            </div>
          </div>
        )}
        <Form.Item label={t('maximumWidth')} {...formItemLayout}>
          <ObjectMaxWidthSlider value={maxWidth} onChange={handleMaxWidthValueChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

ImageEditor.propTypes = {
  ...sectionEditorProps
};

export default ImageEditor;


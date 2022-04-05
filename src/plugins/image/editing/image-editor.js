import RegionSelect from 'react-region-select';
import { useTranslation } from 'react-i18next';
import validation from '../../../ui/validation.js';
import { Form, Input, Radio, InputNumber } from 'antd';
import React, { Fragment, useEffect, useState } from 'react';
import ClientConfig from '../../../bootstrap/client-config.js';
import { getImageDimensions, getImageSource } from '../utils.js';
import { useService } from '../../../components/container-context.js';
import { sectionEditorProps } from '../../../ui/default-prop-types.js';
import StorageFilePicker from '../../../components/storage-file-picker.js';
import ObjectMaxWidthSlider from '../../../components/object-max-width-slider.js';
import { EFFECT_TYPE, SOURCE_TYPE, ORIENTATION, SMALL_IMAGE_WIDTH_THRESHOLD } from '../constants.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;
const { TextArea } = Input;

function ImageEditor({ content, onContentChanged, publicStorage, privateStorage }) {
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);
  const [currentImageSource, setCurrentImageSource] = useState(null);
  const [shouldWarnOfSmallImageSize, setShouldWarnOfSmallImageSize] = useState(false);

  const { sourceType, sourceUrl, maxWidth, text, effect } = content;
  const effectType = effect?.type || EFFECT_TYPE.none;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  useEffect(() => {
    setCurrentImageSource(getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl));
  }, [clientConfig, sourceType, sourceUrl]);

  useEffect(() => {
    const src = currentImageSource;
    if (!src) {
      setShouldWarnOfSmallImageSize(false);
      return;
    }

    (async () => {
      const dimensions = await getImageDimensions(src);
      if (src === currentImageSource) {
        setShouldWarnOfSmallImageSize(dimensions && dimensions.width < SMALL_IMAGE_WIDTH_THRESHOLD);
      }
    })();
  }, [currentImageSource]);

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
      case EFFECT_TYPE.clip:
        changeContent({
          effect: {
            type: EFFECT_TYPE.clip
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

  const renderSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('source')} {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value={SOURCE_TYPE.external}>{t('externalLink')}</RadioButton>
        <RadioButton value={SOURCE_TYPE.internal}>{t('internalCdn')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderInternalSourceTypeInput = (value, onInputChangeHandler, inFileChangeHandler) => (
    <FormItem label={t('internalUrl')} {...formItemLayout}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Input
          addonBefore={`${clientConfig.cdnRootUrl}/`}
          value={value}
          onChange={onInputChangeHandler}
          />
        <StorageFilePicker
          publicStorage={publicStorage}
          privateStorage={privateStorage}
          fileName={value}
          onFileNameChanged={inFileChangeHandler}
          />
      </div>
    </FormItem>
  );

  const renderExternalSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderCopyrightInput = (value, onChangeHandler) => (
    <Form.Item label={t('copyrightInfos')} {...formItemLayout}>
      <TextArea value={value} onChange={onChangeHandler} autoSize={{ minRows: 3 }} />
    </Form.Item>
  );

  const regionChanged = newRegions => {
    const region = newRegions[0];
    const newEffect = { ...effect,
      region: {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        data: {}
      } };
    changeContent({ effect: newEffect });
  };

  return (
    <div>
      <Form layout="horizontal">
        {renderSourceTypeInput(sourceType, handleSourceTypeValueChanged)}

        {sourceType === SOURCE_TYPE.external
          && renderExternalSourceTypeInput(sourceUrl, handleExternalSourceUrlValueChanged)}

        {sourceType === SOURCE_TYPE.internal
          && renderInternalSourceTypeInput(sourceUrl, handleInternalSourceUrlValueChanged, handleInternalSourceUrlFileNameChanged)}

        {renderCopyrightInput(text, handleCopyrightInfoValueChanged)}

        <Form.Item label={t('effectTypeLabel')} {...formItemLayout}>
          <RadioGroup value={effectType} onChange={handleEffectOptionChange}>
            <RadioButton value={EFFECT_TYPE.none}>{t('noneOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.hover}>{t('hoverOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.reveal}>{t('revealOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.clip}>{t('clipOption')}</RadioButton>
          </RadioGroup>
        </Form.Item>

        {effect && (
          <div className="Panel">
            <div className="Panel-content Panel-content--darker">
              {[EFFECT_TYPE.hover, EFFECT_TYPE.reveal].includes(effect.type) && (
                <Fragment>
                  {renderSourceTypeInput(effect.sourceType, handleEffectSourceTypeValueChanged)}

                  {effect.sourceType === SOURCE_TYPE.external
                  && renderExternalSourceTypeInput(effect.sourceUrl, handleEffectExternalSourceUrlValueChanged)}

                  {effect.sourceType === SOURCE_TYPE.internal
                  && renderInternalSourceTypeInput(effect.sourceUrl, handleEffectInternalSourceUrlValueChanged, handleEffectInternalSourceUrlFileNameChanged)}

                  {renderCopyrightInput(effect.text, handleEffectCopyrightInfoValueChanged)}
                </Fragment>
              )}

              {effect.type === EFFECT_TYPE.reveal && (
                <Fragment>
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
                </Fragment>
              )}

              {effect.type === EFFECT_TYPE.clip && (
                <div>
                  <RegionSelect maxRegions={1} regions={effect.region ? [effect.region] : []} onChange={regionChanged}>
                    <img src={sourceUrl} className="Image-clipEffectSettingImage" />
                  </RegionSelect>
                </div>
              )}
            </div>
          </div>
        )}
        <Form.Item
          label={t('maximumWidth')}
          {...formItemLayout}
          validateStatus={shouldWarnOfSmallImageSize ? 'warning' : null}
          help={shouldWarnOfSmallImageSize ? t('smallImageSizeWarning') : null}
          >
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


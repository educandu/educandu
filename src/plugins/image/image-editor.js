import RegionSelect from 'react-region-select';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Radio, InputNumber } from 'antd';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { getImageDimensions, getImageSource } from './utils.js';
import ResourcePicker from '../../components/resource-picker.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';
import { storageLocationPathToUrl, urlToSorageLocationPath } from '../../utils/storage-utils.js';
import { EFFECT_TYPE, SOURCE_TYPE, ORIENTATION, SMALL_IMAGE_WIDTH_THRESHOLD } from './constants.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const defaultClipRegion = { x: 10, y: 10, width: 80, height: 80 };

function ImageEditor({ content, onContentChanged }) {
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);
  const [currentImageSource, setCurrentImageSource] = useState(null);
  const [smallImageSizeWarning, setSmallImageSizeWarning] = useState(null);
  const [clipSizeInPx, setClipSizeInPx] = useState({ width: 0, height: 0 });

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
      setSmallImageSizeWarning(null);
      return;
    }

    if (effectType === EFFECT_TYPE.clip) {
      return;
    }

    (async () => {
      if (src !== currentImageSource) {
        return;
      }
      const dimensions = await getImageDimensions(src);
      setSmallImageSizeWarning(dimensions && dimensions.width < SMALL_IMAGE_WIDTH_THRESHOLD ? t('smallImageSizeWarning') : null);
    })();
  }, [currentImageSource, effectType, t]);

  const updateClipState = useCallback(() => {
    if (effectType !== EFFECT_TYPE.clip) {
      return;
    }

    if (!currentImageSource) {
      setSmallImageSizeWarning(null);
      setClipSizeInPx({ width: 0, height: 0 });
      return;
    }

    const img = document.getElementById('clipEffectImage');
    if (!img) {
      return;
    }

    const clipWidth = Math.round(img.naturalWidth * (effect.region.width / 100));
    const clipHeight = Math.round(img.naturalHeight * (effect.region.height / 100));

    setClipSizeInPx({ width: clipWidth, height: clipHeight });
    setSmallImageSizeWarning(clipWidth < SMALL_IMAGE_WIDTH_THRESHOLD ? t('smallClippingSizeWarning') : null);
  }, [currentImageSource, effectType, effect, t]);

  useEffect(() => {
    updateClipState();
  }, [updateClipState, effect?.region]);

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl
      = newContent.sourceType === SOURCE_TYPE.external
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    const isInvalidEffectSourceUrl
      = [EFFECT_TYPE.hover, EFFECT_TYPE.reveal].includes(newContent.effect?.type)
      && newContent.effect.sourceType === SOURCE_TYPE.external
      && validation.validateUrl(newContent.effect.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl || isInvalidEffectSourceUrl);
  };

  const getResetEffect = () => {
    switch (effectType) {
      case EFFECT_TYPE.none:
        return null;
      case EFFECT_TYPE.clip:
        return { ...effect, region: { ...defaultClipRegion } };
      default:
        return { ...effect };
    }
  };

  const handleSourceTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '', effect: getResetEffect() });
  };

  const handleExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value, effect: getResetEffect() });
  };

  const handleInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value, effect: getResetEffect() });
  };

  const handleInternalSourceUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value, effect: getResetEffect() });
  };

  const handleCopyrightInfoValueChanged = event => {
    const { value } = event.target;
    changeContent({ text: value });
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
            type: EFFECT_TYPE.clip,
            region: { ...defaultClipRegion }
          }
        });
        break;
      case EFFECT_TYPE.none:
      default:
        changeContent({ effect: null });
    }
  };

  const handleEffectExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleEffectInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleEffectInternalSourceUrlFileNameChanged = value => {
    const newEffect = { ...effect, sourceUrl: value };
    changeContent({ effect: newEffect });
  };

  const handleEffectSourceTypeValueChanged = event => {
    const { value } = event.target;
    const newEffect = { ...effect, sourceType: value, sourceUrl: '' };
    changeContent({ effect: newEffect });
  };

  const handleMaxWidthValueChanged = value => {
    changeContent({ maxWidth: value });
  };

  const handleOrientationValueChanged = event => {
    const { value } = event.target;
    const newEffect = { effect, orientation: value };
    changeContent({ effect: newEffect });
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

  const handleClipEffectImageLoad = () => updateClipState();

  const handleClipRegionsChanged = newRegions => {
    const region = newRegions[0];
    const newEffect = {
      ...effect,
      region: {
        x: Math.round(region.x),
        y: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height)
      }
    };
    changeContent({ effect: newEffect });
  };

  const renderSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:source')} {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value={SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
        <RadioButton value={SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderInternalSourceTypeInput = (value, onInputChangeHandler, onFileChangeHandler) => (
    <FormItem label={t('common:internalUrl')} {...formItemLayout}>
      <div className="u-input-and-button">
        <Input
          addonBefore={`${clientConfig.cdnRootUrl}/`}
          value={value}
          onChange={onInputChangeHandler}
          />
        <ResourcePicker
          url={storageLocationPathToUrl(value)}
          onUrlChange={url => onFileChangeHandler(urlToSorageLocationPath(url))}
          />
      </div>
    </FormItem>
  );

  const renderExternalSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderCopyrightInput = (value, onChangeHandler) => (
    <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
      <MarkdownInput value={value} onChange={onChangeHandler} />
    </Form.Item>
  );

  return (
    <div className="ImageEditor">
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
                <div className="ImageEditor-clipEffect">
                  {!!currentImageSource && (
                    <Fragment>
                      <div className="ImageEditor-clipEffectHint">{t('clipEffectHint')}</div>
                      <RegionSelect
                        constraint
                        maxRegions={1}
                        regions={[{ ...effect.region, data: {} }]}
                        onChange={handleClipRegionsChanged}
                        regionStyle={{ outlineWidth: '2px', borderWidth: '2px' }}
                        >
                        <img src={currentImageSource} className="ImageEditor-clipEffectImage" id="clipEffectImage" onLoad={handleClipEffectImageLoad} />
                      </RegionSelect>
                    </Fragment>
                  )}
                  <div className="ImageEditor-clipEffectRegion">
                    <div>{t('clippedWidth')}: {`${clipSizeInPx.width} px`}</div>
                    <div>{t('clippedHeight')}: {`${clipSizeInPx.height} px`}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Form.Item
          className="ImageEditor-maxWidthInput"
          label={t('maximumWidth')}
          {...formItemLayout}
          validateStatus={smallImageSizeWarning ? 'warning' : null}
          help={smallImageSizeWarning}
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


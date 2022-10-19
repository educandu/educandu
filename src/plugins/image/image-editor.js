import RegionSelect from 'react-region-select';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, Radio, InputNumber, Tooltip } from 'antd';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { ensureIsExcluded } from '../../utils/array-utils.js';
import MarkdownInput from '../../components/markdown-input.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { isInternalSourceType, getAccessibleUrl } from '../../utils/source-utils.js';
import {
  createDefaultClipEffect,
  createDefaultHoverEffect,
  createDefaultRevealEffect,
  createInitialClipEffect,
  createInitialRevealEffect
}
  from './image-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const resetRevealEffect = effectType => {
  return effectType === EFFECT_TYPE.reveal ? createInitialRevealEffect() : createDefaultRevealEffect();
};

const resetClipEffect = effectType => {
  return effectType === EFFECT_TYPE.clip ? createInitialClipEffect() : createDefaultClipEffect();
};

function ImageEditor({ content, onContentChanged }) {
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);
  const [currentImageSource, setCurrentImageSource] = useState(null);
  const [clipSizeInPx, setClipSizeInPx] = useState({ width: 0, height: 0 });

  const { sourceType, sourceUrl, width, copyrightNotice, effectType, hoverEffect, revealEffect, clipEffect } = content;

  useEffect(() => {
    setCurrentImageSource(getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl }));
  }, [clientConfig, sourceType, sourceUrl]);

  const updateClipEffectState = useCallback(() => {
    if (effectType !== EFFECT_TYPE.clip) {
      return;
    }

    if (!currentImageSource) {
      setClipSizeInPx({ width: 0, height: 0 });
      return;
    }

    const img = document.getElementById('clipEffectImage');
    if (!img) {
      return;
    }

    const clipWidth = Math.round(img.naturalWidth * (clipEffect.region.width / 100));
    const clipHeight = Math.round(img.naturalHeight * (clipEffect.region.height / 100));

    setClipSizeInPx({ width: clipWidth, height: clipHeight });
  }, [currentImageSource, effectType, clipEffect]);

  useEffect(() => {
    updateClipEffectState();
  }, [updateClipEffectState, clipEffect.region]);

  const isInvalidUrl = url => !isInternalSourceType({ url, cdnRootUrl: clientConfig.cdnRootUrl })
    && validation.getUrlValidationStatus(url) === URL_VALIDATION_STATUS.error;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };

    const isInvalidSourceUrl = isInvalidUrl(newContent.sourceUrl);
    const isInvalidHoverEffectSourceUrl = newContent.effectType === EFFECT_TYPE.hover
      && isInvalidUrl(newContent.hoverEffect.sourceUrl);
    const isInvalidRevealEffectSourceUrl = newContent.effectType === EFFECT_TYPE.reveal
      && isInvalidUrl(newContent.revealEffect.sourceUrl);

    onContentChanged(newContent, isInvalidSourceUrl || isInvalidHoverEffectSourceUrl || isInvalidRevealEffectSourceUrl);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value, clipEffect: resetClipEffect(effectType) });
  };

  const handleCopyrightNoticeChange = event => {
    const { value } = event.target;
    changeContent({ copyrightNotice: value });
  };

  const handleWidthChange = value => {
    changeContent({ width: value });
  };

  const handleEffectTypeChange = event => {
    const { value } = event.target;
    changeContent({
      effectType: value,
      hoverEffect: createDefaultHoverEffect(),
      revealEffect: resetRevealEffect(value),
      clipEffect: resetClipEffect(value)
    });
  };

  const handleHoverEffectSourceUrlChange = value => {
    const newHoverEffect = { ...hoverEffect, sourceUrl: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleHoverEffectCopyrightNoticeChange = event => {
    const { value } = event.target;
    const newHoverEffect = { ...hoverEffect, copyrightNotice: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleRevealEffectSourceUrlChange = value => {
    const newRevealEffect = { ...revealEffect, sourceUrl: value };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectCopyrightNoticeChange = event => {
    const { value } = event.target;
    const newRevealEffect = { ...revealEffect, copyrightNotice: value };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectStartPositionChange = newPosition => {
    const newRevealEffect = { ...revealEffect, startPosition: Math.max(0, Math.min(100, newPosition)) };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectOrientationChange = event => {
    const { value } = event.target;
    const newRevealEffect = { ...revealEffect, orientation: value };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleClipEffectImageLoad = () => updateClipEffectState();

  const handleClipRegionsChanged = newRegions => {
    const region = newRegions[0];
    const newClipEffect = {
      region: {
        x: Math.round(region.x),
        y: Math.round(region.y),
        width: Math.round(region.width),
        height: Math.round(region.height)
      }
    };
    changeContent({ clipEffect: newClipEffect });
  };

  const renderCopyrightNoticeInput = (value, onChangeHandler) => (
    <Form.Item label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
      <MarkdownInput value={value} onChange={onChangeHandler} />
    </Form.Item>
  );

  const allowedSourceTypes = ensureIsExcluded(Object.values(SOURCE_TYPE), SOURCE_TYPE.youtube);

  return (
    <div className="ImageEditor">
      <Form layout="horizontal">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput
            value={sourceUrl}
            allowedSourceTypes={allowedSourceTypes}
            onChange={handleSourceUrlChange}
            />
        </FormItem>
        {renderCopyrightNoticeInput(copyrightNotice, handleCopyrightNoticeChange)}

        <Form.Item label={t('effectTypeLabel')} {...FORM_ITEM_LAYOUT}>
          <RadioGroup value={effectType} onChange={handleEffectTypeChange}>
            <RadioButton value={EFFECT_TYPE.none}>{t('noneOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.hover}>{t('hoverOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.reveal}>{t('revealOption')}</RadioButton>
            <RadioButton value={EFFECT_TYPE.clip}>{t('clipOption')}</RadioButton>
          </RadioGroup>
        </Form.Item>

        {effectType !== EFFECT_TYPE.none && (
          <div className="Panel">
            <div className="Panel-content">
              {effectType === EFFECT_TYPE.hover && (
              <Fragment>
                <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
                  <UrlInput
                    value={hoverEffect.sourceUrl}
                    allowedSourceTypes={allowedSourceTypes}
                    onChange={handleHoverEffectSourceUrlChange}
                    />
                </FormItem>
                {renderCopyrightNoticeInput(hoverEffect.copyrightNotice, handleHoverEffectCopyrightNoticeChange)}
              </Fragment>
              )}

              {effectType === EFFECT_TYPE.reveal && (
              <Fragment>
                <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
                  <UrlInput
                    value={revealEffect.sourceUrl}
                    allowedSourceTypes={allowedSourceTypes}
                    onChange={handleRevealEffectSourceUrlChange}
                    />
                </FormItem>
                {renderCopyrightNoticeInput(revealEffect.copyrightNotice, handleRevealEffectCopyrightNoticeChange)}
                <FormItem label={t('startPosition')} {...FORM_ITEM_LAYOUT}>
                  <InputNumber
                    defaultValue={revealEffect.startPosition}
                    min={0}
                    max={100}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    onChange={handleRevealEffectStartPositionChange}
                    />
                </FormItem>
                <FormItem label={t('orientationLabel')} {...FORM_ITEM_LAYOUT}>
                  <RadioGroup value={revealEffect.orientation} onChange={handleRevealEffectOrientationChange}>
                    <RadioButton value={ORIENTATION.horizontal}>{t('orientationOptionHorizontal')}</RadioButton>
                    <RadioButton value={ORIENTATION.vertical}>{t('orientationOptionVertical')}</RadioButton>
                  </RadioGroup>
                </FormItem>
              </Fragment>
              )}

              {effectType === EFFECT_TYPE.clip && (
                <div className="ImageEditor-clipEffect">
                  {!!currentImageSource && (
                    <Fragment>
                      <div className="ImageEditor-clipEffectHint">{t('clipEffectHint')}</div>
                      <RegionSelect
                        constraint
                        maxRegions={1}
                        regions={[{ ...clipEffect.region, data: {} }]}
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
          className="ImageEditor-widthInput"
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
      </Form>
    </div>
  );
}

ImageEditor.propTypes = {
  ...sectionEditorProps
};

export default ImageEditor;


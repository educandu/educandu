import RegionSelect from 'react-region-select';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import urlUtils from '../../utils/url-utils.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MarkdownInput from '../../components/markdown-input.js';
import { Form, Input, Radio, InputNumber, Tooltip } from 'antd';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { CDN_URL_PREFIX, IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';
import { createDefaultClipEffect, createDefaultHoverEffect, createDefaultRevealEffect, createInitialClipEffect, createInitialRevealEffect } from './image-utils.js';

const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;
const FormItem = Form.Item;

const formItemLayout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 14 }
};

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
    setCurrentImageSource(urlUtils.getImageUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl }));
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

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl
      = newContent.sourceType === IMAGE_SOURCE_TYPE.external
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';

    const isInvalidHoverEffectSourceUrl
      = newContent.effectType === EFFECT_TYPE.hover
      && newContent.hoverEffect.sourceType === IMAGE_SOURCE_TYPE.external
      && validation.validateUrl(newContent.hoverEffect.sourceUrl, t).validateStatus === 'error';

    const isInvalidClipEffectSourceUrl
      = newContent.effectType === EFFECT_TYPE.clip
      && newContent.clipEffect.sourceType === IMAGE_SOURCE_TYPE.external
      && validation.validateUrl(newContent.clipEffect.sourceUrl, t).validateStatus === 'error';

    onContentChanged(newContent, isInvalidSourceUrl || isInvalidHoverEffectSourceUrl || isInvalidClipEffectSourceUrl);
  };

  const handleSourceTypeChange = event => {
    const { value } = event.target;
    changeContent({
      sourceType: value,
      sourceUrl: '',
      copyrightNotice: '',
      clipEffect: resetClipEffect(effectType)
    });
  };

  const handleExternalSourceUrlChange = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value, clipEffect: resetClipEffect(effectType) });
  };

  const handleInternalSourceUrlChange = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value, clipEffect: resetClipEffect(effectType) });
  };

  const handleInternalSourceUrlFileNameChange = value => {
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

  const handleHoverEffectSourceTypeChange = event => {
    const { value } = event.target;
    const newHoverEffect = { ...hoverEffect, sourceType: value, sourceUrl: '' };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleHoverEffectExternalSourceUrlChange = event => {
    const { value } = event.target;
    const newHoverEffect = { ...hoverEffect, sourceUrl: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleHoverEffectInternalSourceUrlChange = event => {
    const { value } = event.target;
    const newHoverEffect = { ...hoverEffect, sourceUrl: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleHoverEffectInternalSourceUrlFileNameChange = value => {
    const newHoverEffect = { ...hoverEffect, sourceUrl: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleHoverEffectCopyrightNoticeChange = event => {
    const { value } = event.target;
    const newHoverEffect = { ...hoverEffect, copyrightNotice: value };
    changeContent({ hoverEffect: newHoverEffect });
  };

  const handleRevealEffectSourceTypeChange = event => {
    const { value } = event.target;
    const newRevealEffect = { ...revealEffect, sourceType: value, sourceUrl: '' };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectExternalSourceUrlChange = event => {
    const { value } = event.target;
    const newRevealEffect = { ...revealEffect, sourceUrl: value };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectInternalSourceUrlChange = event => {
    const { value } = event.target;
    const newRevealEffect = { ...revealEffect, sourceUrl: value };
    changeContent({ revealEffect: newRevealEffect });
  };

  const handleRevealEffectInternalSourceUrlFileNameChange = value => {
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

  const renderSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:source')} {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value={IMAGE_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
        <RadioButton value={IMAGE_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderInternalSourceTypeInput = (value, onInputChangeHandler, onFileChangeHandler) => (
    <FormItem label={t('common:internalUrl')} {...formItemLayout}>
      <div className="u-input-and-button">
        <Input
          addonBefore={CDN_URL_PREFIX}
          value={value}
          onChange={onInputChangeHandler}
          />
        <ResourcePicker
          url={storageLocationPathToUrl(value)}
          onUrlChange={url => onFileChangeHandler(urlToStorageLocationPath(url))}
          />
      </div>
    </FormItem>
  );

  const renderExternalSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderCopyrightNoticeInput = (value, onChangeHandler) => (
    <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
      <MarkdownInput value={value} onChange={onChangeHandler} />
    </Form.Item>
  );

  return (
    <div className="ImageEditor">
      <Form layout="horizontal">
        {renderSourceTypeInput(sourceType, handleSourceTypeChange)}
        {sourceType === IMAGE_SOURCE_TYPE.external && renderExternalSourceTypeInput(
          sourceUrl,
          handleExternalSourceUrlChange
        )}
        {sourceType === IMAGE_SOURCE_TYPE.internal && renderInternalSourceTypeInput(
          sourceUrl,
          handleInternalSourceUrlChange,
          handleInternalSourceUrlFileNameChange
        )}
        {renderCopyrightNoticeInput(copyrightNotice, handleCopyrightNoticeChange)}

        <Form.Item label={t('effectTypeLabel')} {...formItemLayout}>
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
                {renderSourceTypeInput(hoverEffect.sourceType, handleHoverEffectSourceTypeChange)}
                {hoverEffect.sourceType === IMAGE_SOURCE_TYPE.external && renderExternalSourceTypeInput(
                  hoverEffect.sourceUrl,
                  handleHoverEffectExternalSourceUrlChange
                )}
                {hoverEffect.sourceType === IMAGE_SOURCE_TYPE.internal && renderInternalSourceTypeInput(
                  hoverEffect.sourceUrl,
                  handleHoverEffectInternalSourceUrlChange,
                  handleHoverEffectInternalSourceUrlFileNameChange
                )}
                {renderCopyrightNoticeInput(hoverEffect.copyrightNotice, handleHoverEffectCopyrightNoticeChange)}
              </Fragment>
              )}

              {effectType === EFFECT_TYPE.reveal && (
              <Fragment>
                {renderSourceTypeInput(revealEffect.sourceType, handleRevealEffectSourceTypeChange)}
                {revealEffect.sourceType === IMAGE_SOURCE_TYPE.external && renderExternalSourceTypeInput(
                  revealEffect.sourceUrl,
                  handleRevealEffectExternalSourceUrlChange
                )}
                {revealEffect.sourceType === IMAGE_SOURCE_TYPE.internal && renderInternalSourceTypeInput(
                  revealEffect.sourceUrl,
                  handleRevealEffectInternalSourceUrlChange,
                  handleRevealEffectInternalSourceUrlFileNameChange
                )}
                {renderCopyrightNoticeInput(revealEffect.copyrightNotice, handleRevealEffectCopyrightNoticeChange)}
                <FormItem label={t('startPosition')} {...formItemLayout}>
                  <InputNumber
                    defaultValue={revealEffect.startPosition}
                    min={0}
                    max={100}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                    onChange={handleRevealEffectStartPositionChange}
                    />
                </FormItem>
                <FormItem label={t('orientationLabel')} {...formItemLayout}>
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
          {...formItemLayout}
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


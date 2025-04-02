import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import ClientConfig from '../../bootstrap/client-config.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, styleFitContainer } from 'react-compare-slider';
import EmptyState, { EMPTY_STATE_STATUS } from '../../components/empty-state.js';
import { EFFECT_TYPE, HOVER_OR_REVEAL_ACTION, ORIENTATION } from './constants.js';

function ImageDisplay({ content }) {
  const mainImageRef = useRef();
  const hoverEffectCanvasRef = useRef();
  const clipEffectCanvasRef = useRef();
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [hasMainImageFailed, setHasMainImageFailed] = useState(false);
  const [shouldApplyHoverEffect, setShouldApplyHoverEffect] = useState(false);

  const { copyrightNotice, sourceUrl, effectType, hoverEffect, revealEffect, clipEffect, width } = content;
  const src = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  useEffect(() => {
    const mainImage = mainImageRef.current;
    if (!mainImage || !sourceUrl) {
      return;
    }

    if (mainImage.complete) {
      setIsMainImageLoaded(mainImage.naturalHeight !== 0);
      setHasMainImageFailed(mainImage.naturalHeight === 0);
    } else {
      mainImage.onload = () => setIsMainImageLoaded(true);
      mainImage.onerror = () => setHasMainImageFailed(true);
    }
  }, [mainImageRef, sourceUrl]);

  useEffect(() => {
    if (effectType !== EFFECT_TYPE.hover || !isMainImageLoaded) {
      return;
    }
    const mainImage = mainImageRef.current;
    const canvas = hoverEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;

    const hoverImage = new Image();
    hoverImage.src = getAccessibleUrl({ url: hoverEffect.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    hoverImage.onload = () => {
      const widthFactor = canvas.width / hoverImage.naturalWidth;
      const heightFactor = canvas.height / hoverImage.naturalHeight;
      const factorToUse = Math.min(heightFactor, widthFactor);
      const finalHeight = hoverImage.naturalHeight * factorToUse;
      const finalWidth = hoverImage.naturalWidth * factorToUse;
      context.drawImage(hoverImage, 0, 0, hoverImage.naturalWidth, hoverImage.naturalHeight, 0, 0, finalWidth, finalHeight);

    };
  }, [mainImageRef, effectType, hoverEffect, clientConfig, isMainImageLoaded]);

  useEffect(() => {
    if (effectType !== EFFECT_TYPE.clip || !isMainImageLoaded) {
      return;
    }
    const mainImage = mainImageRef.current;
    const canvas = clipEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    const mainImageWidth = mainImage.naturalWidth * (clipEffect.region.width / 100);
    const mainImageHeight = mainImage.naturalHeight * (clipEffect.region.height / 100);
    const x = mainImage.naturalWidth * (clipEffect.region.x / 100);
    const y = mainImage.naturalHeight * (clipEffect.region.y / 100);
    canvas.width = mainImageWidth;
    canvas.height = mainImageHeight;
    context.drawImage(mainImage, x, y, mainImageWidth, mainImageHeight, 0, 0, mainImageWidth, mainImageHeight);
  }, [clipEffectCanvasRef, mainImageRef, effectType, clipEffect, isMainImageLoaded]);

  const handleMainImageMouseEnter = () => {
    if (effectType === EFFECT_TYPE.hover) {
      setShouldApplyHoverEffect(true);
    }
  };

  const handleHoverEffectImageMouseLeave = () => {
    setShouldApplyHoverEffect(false);
  };

  const renderHoverEffect = () => (
    <canvas
      ref={hoverEffectCanvasRef}
      className={`ImageDisplay-hoverEffectImage u-width-${width}`}
      onMouseLeave={handleHoverEffectImageMouseLeave}
      />
  );

  const renderRevealEffect = () => {
    const imageUrl = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
    const effectImageUrl = getAccessibleUrl({ url: revealEffect.sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

    return (
      <ReactCompareSlider
        position={revealEffect.startPosition}
        portrait={revealEffect.orientation === ORIENTATION.vertical}
        className={`ImageDisplay-mainImage u-width-${width}`}
        clip={revealEffect.revealAction === HOVER_OR_REVEAL_ACTION.overlay ? 'itemOne' : 'both'}
        itemOne={!!isMainImageLoaded && <img src={effectImageUrl} style={styleFitContainer()} />}
        itemTwo={<img src={imageUrl} ref={mainImageRef} style={styleFitContainer()} />}
        />
    );
  };

  const renderClipEffect = () => (
    <Fragment>
      <canvas className={`ImageDisplay-mainImage u-width-${width}`} ref={clipEffectCanvasRef} />
      <img className="ImageDisplay-clipEffectImage" src={src} ref={mainImageRef} />
    </Fragment>
  );

  const mainImageClasses = classNames(
    'ImageDisplay-mainImage',
    `u-width-${width}`,
    {
      'ImageDisplay-mainImage--hoverEffect': shouldApplyHoverEffect,
      'ImageDisplay-mainImage--hoverEffectHidden': shouldApplyHoverEffect && hoverEffect.hoverAction === HOVER_OR_REVEAL_ACTION.switch
    }
  );

  const showMainImageCopyright = !shouldApplyHoverEffect;
  const showHoverEffectImageCopyright = effectType === EFFECT_TYPE.hover && hoverEffect.copyrightNotice && shouldApplyHoverEffect;
  const showRevealEffectImageCopyright = effectType === EFFECT_TYPE.reveal && revealEffect.copyrightNotice;

  if (hasMainImageFailed) {
    return (
      <EmptyState
        status={EMPTY_STATE_STATUS.error}
        title={t('loadingErrorEmptyStateTitle')}
        subtitle={t('loadingErrorEmptyStateSubtitle')}
        />
    );
  }

  return (
    <div className="ImageDisplay">
      {(effectType === EFFECT_TYPE.none || effectType === EFFECT_TYPE.hover) && (
        <img
          ref={mainImageRef}
          className={mainImageClasses}
          onMouseEnter={handleMainImageMouseEnter}
          src={getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl })}
          />
      )}
      {effectType === EFFECT_TYPE.hover && renderHoverEffect()}
      {effectType === EFFECT_TYPE.reveal && renderRevealEffect()}
      {effectType === EFFECT_TYPE.clip && renderClipEffect()}
      {!!showMainImageCopyright && (
        <div className={`u-horizontally-centered u-width-${width}`}>
          <CopyrightNotice value={copyrightNotice} />
        </div>
      )}
      {!!showHoverEffectImageCopyright && (
        <div className={`u-horizontally-centered u-width-${width}`}>
          <CopyrightNotice value={hoverEffect.copyrightNotice} />
        </div>
      )}
      {!!showRevealEffectImageCopyright && (
        <div className={`u-horizontally-centered u-width-${width}`}>
          <CopyrightNotice value={revealEffect.copyrightNotice} />
        </div>
      )}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageDisplay;

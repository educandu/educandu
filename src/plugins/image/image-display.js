import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import CopyrightNotice from '../../components/copyright-notice.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

function ImageDisplay({ content }) {
  const mainImageRef = useRef();
  const hoverEffectCanvasRef = useRef();
  const clipEffectCanvasRef = useRef();
  const { t } = useTranslation('image');
  const clientConfig = useService(ClientConfig);
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [hasMainImageFailed, setHasMainImageFailed] = useState(false);
  const [shouldApplyHoverEffect, setShouldApplyHoverEffect] = useState(false);

  const { copyrightNotice, sourceType, sourceUrl, effect, width } = content;
  const src = urlUtils.getImageUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  useEffect(() => {
    const mainImage = mainImageRef.current;
    if (!mainImage) {
      return;
    }

    if (mainImage.complete) {
      setIsMainImageLoaded(mainImage.naturalHeight !== 0);
      setHasMainImageFailed(mainImage.naturalHeight === 0);
    } else {
      mainImage.onload = () => setIsMainImageLoaded(true);
      mainImage.onerror = () => setHasMainImageFailed(true);
    }
  }, [mainImageRef]);

  useEffect(() => {
    if (effect?.type !== EFFECT_TYPE.hover || !isMainImageLoaded) {
      return;
    }
    const mainImage = mainImageRef.current;
    const canvas = hoverEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = mainImage.width;
    canvas.height = mainImage.height;

    const hoverImage = new Image();
    hoverImage.src = urlUtils.getImageUrl({
      cdnRootUrl: clientConfig.cdnRootUrl,
      sourceType: effect.sourceType,
      sourceUrl: effect.sourceUrl
    });

    hoverImage.onload = () => {
      const widthFactor = canvas.width / hoverImage.naturalWidth;
      const heightFactor = canvas.height / hoverImage.naturalHeight;
      const factorToUse = Math.min(heightFactor, widthFactor);
      const finalHeight = hoverImage.naturalHeight * factorToUse;
      const finalWidth = hoverImage.naturalWidth * factorToUse;
      context.drawImage(hoverImage, 0, 0, hoverImage.naturalWidth, hoverImage.naturalHeight, 0, 0, finalWidth, finalHeight);

    };
  }, [mainImageRef, effect, clientConfig, isMainImageLoaded]);

  useEffect(() => {
    if (effect?.type !== EFFECT_TYPE.clip || !isMainImageLoaded) {
      return;
    }
    const mainImage = mainImageRef.current;
    const canvas = clipEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    const mainImageWidth = mainImage.naturalWidth * (effect.region.width / 100);
    const mainImageHeight = mainImage.naturalHeight * (effect.region.height / 100);
    const x = mainImage.naturalWidth * (effect.region.x / 100);
    const y = mainImage.naturalHeight * (effect.region.y / 100);
    canvas.width = mainImageWidth;
    canvas.height = mainImageHeight;
    context.drawImage(mainImage, x, y, mainImageWidth, mainImageHeight, 0, 0, mainImageWidth, mainImageHeight);
  }, [clipEffectCanvasRef, mainImageRef, effect, isMainImageLoaded]);

  const handleMainImageMouseEnter = () => {
    if (effect?.type === EFFECT_TYPE.hover) {
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

  const renderRevealEffect = () => (
    <ReactCompareSlider
      position={effect.startPosition}
      portrait={effect.orientation === ORIENTATION.vertical}
      className={`ImageDisplay-mainImage u-width-${width}`}
      itemOne={<ReactCompareSliderImage
        src={urlUtils.getImageUrl({
          cdnRootUrl: clientConfig.cdnRootUrl,
          sourceType: effect.sourceType,
          sourceUrl: effect.sourceUrl
        })}
        />}
      itemTwo={<ReactCompareSliderImage src={urlUtils.getImageUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl })} />}
      />
  );

  const renderClipEffect = () => (
    <Fragment>
      <canvas className={`ImageDisplay-mainImage u-width-${width}`} ref={clipEffectCanvasRef} />
      <img className="ImageDisplay-clipEffectImage" src={src} ref={mainImageRef} />
    </Fragment>
  );

  const mainImageClasses = classNames(
    'ImageDisplay-mainImage',
    `u-width-${width}`,
    { 'ImageDisplay-mainImage--hoverEffect': shouldApplyHoverEffect }
  );

  const showMainImageCopyright = !shouldApplyHoverEffect;
  const showEffectImageCopyright = effect?.copyrightNotice
    && (effect.type === EFFECT_TYPE.reveal || (effect.type === EFFECT_TYPE.hover && shouldApplyHoverEffect));

  if (hasMainImageFailed) {
    return (
      <div className="ImageDisplay">
        <div className="ImageDisplay-errorMessage">{t('imageLoadingErrorMessage')}</div>
      </div>
    );
  }

  return (
    <div className="ImageDisplay">
      {effect?.type === EFFECT_TYPE.reveal && renderRevealEffect()}
      {effect?.type === EFFECT_TYPE.clip && renderClipEffect()}
      {effect?.type !== EFFECT_TYPE.reveal && effect?.type !== EFFECT_TYPE.clip && (
        <img
          ref={mainImageRef}
          className={mainImageClasses}
          onMouseEnter={handleMainImageMouseEnter}
          src={urlUtils.getImageUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl })}
          />
      )}
      {effect?.type === EFFECT_TYPE.hover && renderHoverEffect()}
      {showMainImageCopyright && <CopyrightNotice value={copyrightNotice} />}
      {showEffectImageCopyright && <CopyrightNotice value={effect.copyrightNotice} />}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageDisplay;

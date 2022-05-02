import classNames from 'classnames';
import { getImageSource } from './utils.js';
import Markdown from '../../components/markdown.js';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

function ImageDisplay({ content }) {
  const mainImageRef = useRef();
  const hoverEffectCanvasRef = useRef();
  const clipEffectImageRef = useRef();
  const clipEffectCanvasRef = useRef();
  const maxWidth = content.maxWidth || 100;
  const { text, sourceType, sourceUrl, effect } = content;
  const [isMainImageLoaded, setIsMainImageLoaded] = useState(false);
  const [shouldApplyHoverEffect, setShouldApplyHoverEffect] = useState(false);

  const clientConfig = useService(ClientConfig);
  const src = getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl);

  useEffect(() => {
    const mainImage = mainImageRef.current;
    if (!mainImage) {
      return;
    }

    const isLoaded = mainImage.complete && mainImage.naturalHeight !== 0;
    if (isLoaded) {
      setIsMainImageLoaded(true);
    }
    mainImage.onload = () => setIsMainImageLoaded(true);
  }, [mainImageRef]);

  useEffect(() => {
    if (effect?.type !== EFFECT_TYPE.hover || !isMainImageLoaded) {
      return;
    }
    const mainImage = mainImageRef.current;
    const canvas = hoverEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = mainImage.naturalWidth;
    canvas.height = mainImage.naturalHeight;

    const hoverImage = new Image();
    hoverImage.src = getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl);

    hoverImage.onload = () => {
      context.drawImage(hoverImage, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    };
  }, [mainImageRef, effect, clientConfig, isMainImageLoaded]);

  useEffect(() => {
    if (effect?.type !== EFFECT_TYPE.clip) {
      return;
    }
    const img = clipEffectImageRef.current;
    const canvas = clipEffectCanvasRef.current;
    const context = canvas.getContext('2d');
    const width = img.naturalWidth * (effect.region.width / 100);
    const height = img.naturalHeight * (effect.region.height / 100);
    const x = img.naturalWidth * (effect.region.x / 100);
    const y = img.naturalHeight * (effect.region.y / 100);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(img, x, y, width, height, 0, 0, width, height);
  }, [clipEffectCanvasRef, clipEffectImageRef, effect]);

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
      className={`ImageDisplay-hoverEffectImage u-max-width-${maxWidth}`}
      onMouseLeave={handleHoverEffectImageMouseLeave}
      />
  );

  const renderRevealEffect = () => (
    <ReactCompareSlider
      position={effect.startPosition}
      portrait={effect.orientation === ORIENTATION.vertical}
      className={`ImageDisplay-mainImage u-max-width-${maxWidth}`}
      itemOne={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl)} />}
      itemTwo={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)} />}
      />
  );

  const renderClipEffect = () => (
    <Fragment>
      <canvas className={`ImageDisplay-mainImage u-max-width-${maxWidth}`} ref={clipEffectCanvasRef} />
      <img className="ImageDisplay-clipEffectImage" src={src} ref={clipEffectImageRef} />
      <div className="ImageDisplay-copyrightInfo">
        <Markdown>{text}</Markdown>
      </div>
    </Fragment>
  );

  const mainImageClasses = classNames(
    'ImageDisplay-mainImage',
    `u-max-width-${maxWidth}`,
    { 'ImageDisplay-mainImage--hoverEffect': shouldApplyHoverEffect }
  );

  return (
    <div className="ImageDisplay">
      {effect?.type === EFFECT_TYPE.reveal && renderRevealEffect()}
      {effect?.type === EFFECT_TYPE.clip && renderClipEffect()}
      {effect?.type !== EFFECT_TYPE.reveal && effect?.type !== EFFECT_TYPE.clip && (
        <img
          ref={mainImageRef}
          className={mainImageClasses}
          onMouseEnter={handleMainImageMouseEnter}
          src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)}
          />
      )}
      {effect?.type === EFFECT_TYPE.hover && renderHoverEffect()}
      <div className="ImageDisplay-copyrightInfo">
        <Markdown>{text}</Markdown>
        {effect?.text && <Markdown>{effect.text}</Markdown>}
      </div>
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageDisplay;

import classNames from 'classnames';
import { getImageSource } from '../utils.js';
import Markdown from '../../../components/markdown.js';
import React, { Fragment, useEffect, useRef } from 'react';
import { EFFECT_TYPE, ORIENTATION } from '../constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

function ImageDisplay({ content }) {
  const clipEffectImageRef = useRef();
  const clipEffectCanvasRef = useRef();
  const maxWidth = content.maxWidth || 100;
  const { text, sourceType, sourceUrl, effect } = content;

  const clientConfig = useService(ClientConfig);
  const src = getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl);

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

  const renderRevealEffect = () => (
    <Fragment>
      <ReactCompareSlider
        position={effect.startPosition}
        portrait={effect.orientation === ORIENTATION.vertical}
        className={`ImageDisplay-image u-max-width-${maxWidth}`}
        itemOne={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl)} />}
        itemTwo={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)} />}
        />
      <div className="ImageDisplay-copyrightInfo">
        <Markdown>{text}</Markdown>
        <Markdown>{effect.text}</Markdown>
      </div>
    </Fragment>
  );

  const renderHoverEffect = () => (
    <div className="ImageDisplay-hoverEffectContainer">
      <img
        className={`ImageDisplay-image u-max-width-${maxWidth}`}
        src={getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl)}
        />
      <div className="ImageDisplay-copyrightInfo">
        <Markdown>{effect.text}</Markdown>
      </div>
    </div>
  );

  const renderClipEffect = () => (
    <Fragment>
      <canvas className={`ImageDisplay-image u-max-width-${maxWidth}`} ref={clipEffectCanvasRef} />
      <img className="ImageDisplay-clipEffectImage" src={src} ref={clipEffectImageRef} />
    </Fragment>
  );

  if (effect?.type === EFFECT_TYPE.reveal) {
    return renderRevealEffect();
  }

  if (effect?.type === EFFECT_TYPE.clip) {
    return renderClipEffect();
  }

  return (
    <div className={classNames('ImageDisplay', { 'ImageDisplay--hoverable': effect?.type === EFFECT_TYPE.hover })}>
      <div className="ImageDisplay-container">
        <img
          className={`ImageDisplay-image u-max-width-${maxWidth}`}
          src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)}
          />
        <div className="ImageDisplay-copyrightInfo">
          <Markdown>{text}</Markdown>
        </div>
      </div>
      {effect && renderHoverEffect()}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageDisplay;

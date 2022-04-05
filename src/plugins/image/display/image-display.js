import classNames from 'classnames';
import { getImageSource } from '../utils.js';
import React, { Fragment, useEffect, useRef } from 'react';
import { EFFECT_TYPE, ORIENTATION } from '../constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

function ImageDisplay({ content }) {
  const maxWidth = content.maxWidth || 100;
  const { text, sourceType, sourceUrl, effect } = content;

  const clientConfig = useService(ClientConfig);
  const githubFlavoredMarkdown = useService(GithubFlavoredMarkdown);

  const renderRevealEffect = () => (
    <Fragment>
      <ReactCompareSlider
        position={effect.startPosition}
        portrait={effect.orientation === ORIENTATION.vertical}
        className={`Image-img u-max-width-${maxWidth}`}
        itemOne={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl)} />}
        itemTwo={<ReactCompareSliderImage src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)} />}
        />
      <div className="Image-copyrightInfo">
        <div dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(text || '') }} />
        <div dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(effect.text || '') }} />
      </div>
    </Fragment>
  );

  const renderHoverEffect = () => (
    <div className="Image-secondary">
      <img
        className={`Image-img u-max-width-${maxWidth}`}
        src={getImageSource(clientConfig.cdnRootUrl, effect.sourceType, effect.sourceUrl)}
        />
      <div
        className="Image-copyrightInfo"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(effect.text || '') }}
        />
    </div>
  );

  const src = getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl);

  const canvasRef = useRef();

  useEffect(() => {
    const img = document.getElementById('source');
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const width = img.naturalWidth * (effect.region.width / 100);
    const height = img.naturalHeight * (effect.region.height / 100);
    const x = img.naturalWidth * (effect.region.x / 100);
    const y = img.naturalHeight * (effect.region.y / 100);
    canvas.width = width;
    canvas.height = height;
    context.drawImage(img, x, y, width, height, 0, 0, width, height);
  }, [canvasRef, effect]);

  const renderClipEffect = () => (
    <Fragment>
      <canvas ref={canvasRef} style={{ width: '100%' }} />
      <div style={{ display: 'none' }}>
        <img
          id="source"
          src={src}
          />
      </div>
    </Fragment>
  );

  if (effect?.type === EFFECT_TYPE.reveal) {
    return renderRevealEffect();
  }

  if (effect?.type === EFFECT_TYPE.clip) {
    return renderClipEffect();
  }

  return (
    <div className={classNames('Image', { 'Image--hoverable': effect })}>
      <div className="Image-primary">
        <img
          className={`Image-img u-max-width-${maxWidth}`}
          src={getImageSource(clientConfig.cdnRootUrl, sourceType, sourceUrl)}
          />
        <div
          className="Image-copyrightInfo"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(text || '') }}
          />
      </div>
      {effect && renderHoverEffect()}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageDisplay;

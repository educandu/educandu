import classNames from 'classnames';
import React, { Fragment } from 'react';
import { getImageSource } from '../utils.js';
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

  if (effect?.type === EFFECT_TYPE.reveal) {
    return renderRevealEffect();
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

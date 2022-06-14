import React from 'react';
import classNames from 'classnames';
import urls from '../../utils/routes.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import { HOVER_EFFECT, IMAGE_SOURCE_TYPE, LINK_SOURCE_TYPE } from './constants.js';

function getTileImageUrl(tile, cdnRootUrl) {
  const image = tile.image || {};
  switch (image.sourceType) {
    case IMAGE_SOURCE_TYPE.external:
      return image.sourceUrl;
    case IMAGE_SOURCE_TYPE.internal:
      return image.sourceUrl ? `${cdnRootUrl}/${image.sourceUrl}` : '';
    default:
      return '';
  }
}

const getTileLinkUrl = tile => {
  const link = tile.link || {};
  switch (link.sourceType) {
    case LINK_SOURCE_TYPE.external:
      return link.sourceUrl;
    case LINK_SOURCE_TYPE.document:
      return link.documentId ? urls.getDocUrl({ key: link.documentId }) : '';
    default:
      return '';
  }
};

function ImageTilesDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const renderTile = (tile, index) => {
    const linkUrl = getTileLinkUrl(tile);
    const imageUrl = getTileImageUrl(tile, clientConfig.cdnRootUrl);

    const classes = classNames({
      'ImageTilesDisplay-tile': true,
      'ImageTilesDisplay-tile--noLink': !linkUrl,
      'u-img-color-flip': content.hoverEffect === HOVER_EFFECT.colorizeZoom && linkUrl,
      'u-img-color-flip-hover-disabled': content.hoverEffect === HOVER_EFFECT.colorizeZoom && !linkUrl
    });

    const image = <img className="ImageTilesDisplay-img" src={imageUrl} />;
    const description = (
      <div className="ImageTilesDisplay-description">
        <Markdown inline>{tile.description}</Markdown>
      </div>
    );

    return linkUrl
      ? <a key={index.toString()} className={classes} href={linkUrl}>{image}{description}</a>
      : <span key={index.toString()} className={classes}>{image}{description}</span>;
  };

  return (
    <div className="ImageTilesDisplay">
      <div
        className={`ImageTilesDisplay-grid u-max-width-${content.maxWidth || 100}`}
        style={{ gridTemplateColumns: `repeat(${content.maxTilesPerRow}, 1fr)` }}
        >
        {content.tiles.map(renderTile)}
      </div>
    </div>
  );
}

ImageTilesDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageTilesDisplay;

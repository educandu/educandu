import React from 'react';
import classNames from 'classnames';
import urls from '../../utils/urls.js';
import Markdown from '../../components/markdown.js';
import { IMAGE_TYPE, LINK_TYPE } from './constants.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

function getSource(type, url, cdnRootUrl) {
  switch (type) {
    case IMAGE_TYPE.external:
      return url || null;
    case IMAGE_TYPE.internal:
      return url ? `${cdnRootUrl}/${url}` : null;
    default:
      return null;
  }
}

function ImageTilesDisplay({ content }) {
  const clientConfig = useService(ClientConfig);

  const getTileUrl = tile => {
    const link = tile.link || {};
    switch (link.type) {
      case LINK_TYPE.external:
        return link.url;
      case LINK_TYPE.internal:
        return urls.getDocUrl({ keyAndSlug: link.url });
      default:
        return '';
    }
  };

  const renderTile = (tile, index) => {
    const classes = classNames({
      'ImageTiles-tile': true,
      'u-img-color-flip': content.hoverEffect === 'colorize-zoom'
    });

    if (!tile) {
      return <div key={index.toString()} className={classes} />;
    }

    return (
      <a key={index.toString()} className={classes} href={getTileUrl(tile)}>
        <img
          className="ImageTiles-img"
          src={getSource(tile.image.type, tile.image.url, clientConfig.cdnRootUrl)}
          />
        <div className="ImageTiles-description">
          <Markdown>{tile.description}</Markdown>
        </div>
      </a>
    );
  };

  return (
    <div className={classNames('ImageTiles')}>
      <div
        className={`ImageTiles-grid u-max-width-${content.maxWidth || 100}`}
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

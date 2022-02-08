import React from 'react';
import classNames from 'classnames';
import splitArray from 'split-array';
import urls from '../../../utils/urls.js';
import { IMAGE_TYPE, LINK_TYPE } from '../constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { useService } from '../../../components/container-context.js';
import { sectionDisplayProps } from '../../../ui/default-prop-types.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';

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
  const githubFlavoredMarkdown = useService(GithubFlavoredMarkdown);

  const rows = splitArray(content.tiles, content.maxTilesPerRow);

  if (rows.length) {
    const tilesOfLastRow = rows[rows.length - 1];
    const rest = content.maxTilesPerRow - tilesOfLastRow.length;
    for (let i = 0; i < rest; i += 1) {
      tilesOfLastRow.push(null);
    }
  }

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
      'ImageTiles-tilesContainer': true,
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
        <div
          className="ImageTiles-description"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(tile.description || '') }}
          />
      </a>
    );
  };

  const renderRow = (row, index) => (
    <div key={index} className={`ImageTiles-row u-max-width-${content.maxWidth || 100}`}>
      {row.map(renderTile)}
    </div>
  );

  return (
    <div className={classNames('ImageTiles')}>
      {rows.map(renderRow)}
    </div>
  );
}

ImageTilesDisplay.propTypes = {
  ...sectionDisplayProps
};

export default ImageTilesDisplay;

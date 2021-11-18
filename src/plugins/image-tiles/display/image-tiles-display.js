import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import splitArray from 'split-array';
import urls from '../../../utils/urls.js';
import { IMAGE_TYPE, LINK_TYPE } from '../constants.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import { inject } from '../../../components/container-context.js';
import GithubFlavoredMarkdown from '../../../common/github-flavored-markdown.js';
import { sectionDisplayProps, clientConfigProps } from '../../../ui/default-prop-types.js';

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

function createTileUrl(tile) {
  const link = tile.link || {};
  switch (link.type) {
    case LINK_TYPE.external:
      return link.url;
    case LINK_TYPE.article:
      return urls.getArticleUrl(link.url);
    default:
      return '';
  }
}

function createTile(index, tile, hoverEffect, clientConfig, githubFlavoredMarkdown) {
  const containerClasses = classNames({
    'ImageTiles-tilesContainer': true,
    'u-img-color-flip': hoverEffect === 'colorize-zoom'
  });

  if (!tile) {
    return <div key={index.toString()} className={containerClasses} />;
  }

  return (
    <a key={index.toString()} className={containerClasses} href={createTileUrl(tile)}>
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
}

function createRow(rowIndex, row, content, clientConfig, githubFlavoredMarkdown) {
  return (
    <div key={rowIndex.toString()} className={`ImageTiles-row u-max-width-${content.maxWidth || 100}`}>
      {row.map((tile, tileIndex) => createTile(tileIndex, tile, content.hoverEffect, clientConfig, githubFlavoredMarkdown))}
    </div>
  );
}

function ImageTilesDisplay({ content, clientConfig, githubFlavoredMarkdown }) {
  const rows = splitArray(content.tiles, content.maxTilesPerRow);
  if (rows.length) {
    const tilesOfLastRow = rows[rows.length - 1];
    const rest = content.maxTilesPerRow - tilesOfLastRow.length;
    for (let i = 0; i < rest; i += 1) {
      tilesOfLastRow.push(null);
    }
  }

  return (
    <div className={classNames('ImageTiles')}>
      {rows.map((row, index) => createRow(index, row, content, clientConfig, githubFlavoredMarkdown))}
    </div>
  );
}

ImageTilesDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientConfigProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

export default inject({
  clientConfig: ClientConfig,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, ImageTilesDisplay);

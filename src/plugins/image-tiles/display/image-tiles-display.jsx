const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const splitArray = require('split-array');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');

function getSource(type, url, cdnRootUrl) {
  switch (type) {
    case 'external':
      return url || null;
    case 'internal':
      return url ? `${cdnRootUrl}/${url}` : null;
    default:
      return null;
  }
}

function createTile(index, tile, clientSettings, githubFlavoredMarkdown) {
  return (
    <div key={index.toString()} className="ImageTiles-tilesContainer">
      {tile && (
        <img
          className="ImageTiles-img"
          src={getSource(tile.image.type, tile.image.url, clientSettings.cdnRootUrl)}
          />
      )}
      {tile && (
        <div
          className="ImageTiles-description"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(tile.description || '') }}
          />
      )}
    </div>
  );
}

function createRow(rowIndex, row, content, clientSettings, githubFlavoredMarkdown) {
  return (
    <div key={rowIndex.toString()} className={`ImageTiles-row u-max-width-${content.maxWidth || 100}`}>
      {row.map((tile, tileIndex) => createTile(tileIndex, tile, clientSettings, githubFlavoredMarkdown))}
    </div>
  );
}

function ImageTilesDisplay({ content, clientSettings, githubFlavoredMarkdown }) {
  const rows = splitArray(content.tiles, content.maxTilesPerRow);
  const tilesOfLastRow = rows[rows.length - 1];
  const rest = content.maxTilesPerRow - tilesOfLastRow.length;
  for (let i = 0; i < rest; i += 1) {
    tilesOfLastRow.push(null);
  }

  return (
    <div className={classNames('ImageTiles')}>
      {rows.map((row, index) => createRow(index, row, content, clientSettings, githubFlavoredMarkdown))}
    </div>
  );
}

ImageTilesDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, ImageTilesDisplay);

const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
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

function ImageTilesDisplay({ content, clientSettings, githubFlavoredMarkdown }) {
  return (
    <div className={classNames('ImageTiles')}>
      <div className={`ImageTiles-row u-max-width-${content.maxWidth || 100}`}>
        <div className="ImageTiles-tilesContainer">
          <img
            className="ImageTiles-img"
            src={getSource(content.tiles[0].image.type, content.tiles[0].image.url, clientSettings.cdnRootUrl)}
            />
          <div
            className="ImageTiles-description"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.tiles[0].description || '') }}
            />
        </div>
        <div className="ImageTiles-tilesContainer">
          <img
            className="ImageTiles-img"
            src={getSource(content.tiles[1].image.type, content.tiles[1].image.url, clientSettings.cdnRootUrl)}
            />
          <div
            className="ImageTiles-description"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.tiles[1].description || '') }}
            />
        </div>
        <div className="ImageTiles-tilesContainer">
          <img
            className="ImageTiles-img"
            src={getSource(content.tiles[2].image.type, content.tiles[2].image.url, clientSettings.cdnRootUrl)}
            />
          <div
            className="ImageTiles-description"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.tiles[2].description || '') }}
            />
        </div>
      </div>
      <div className={`ImageTiles-row u-max-width-${content.maxWidth || 100}`}>
        <div className="ImageTiles-tilesContainer">
          <img
            className="ImageTiles-img"
            src={getSource(content.tiles[3].image.type, content.tiles[3].image.url, clientSettings.cdnRootUrl)}
            />
          <div
            className="ImageTiles-description"
            dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.tiles[3].description || '') }}
            />
        </div>
        <div className="ImageTiles-tilesContainer" />
        <div className="ImageTiles-tilesContainer" />
      </div>
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

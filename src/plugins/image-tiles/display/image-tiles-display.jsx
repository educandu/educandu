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
  const hover = content.hover && (
    <div className="ImageTiles-secondary">
      <img
        className={`ImageTiles-img u-max-width-${content.maxWidth || 100}`}
        src={getSource(content.hover.type, content.hover.url, clientSettings.cdnRootUrl)}
        />
      <div
        className="ImageTiles-copyrightInfo"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.hover.text || '') }}
        />
    </div>
  );
  return (
    <div className={classNames('ImageTiles', { 'ImageTiles--hoverable': content.hover })}>
      <div className="ImageTiles-primary">
        <img
          className={`ImageTiles-img u-max-width-${content.maxWidth || 100}`}
          src={getSource(content.type, content.url, clientSettings.cdnRootUrl)}
          />
        <div
          className="ImageTiles-copyrightInfo"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
          />
      </div>
      {hover}
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

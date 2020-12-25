const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context');
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

function ImageDisplay({ content, clientSettings, githubFlavoredMarkdown }) {
  const hover = content.hover && (
    <div className="Image-secondary">
      <img
        className={`Image-img u-max-width-${content.maxWidth || 100}`}
        src={getSource(content.hover.type, content.hover.url, clientSettings.cdnRootUrl)}
        />
      <div
        className="Image-copyrightInfo"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.hover.text || '') }}
        />
    </div>
  );
  return (
    <div className={classNames('Image', { 'Image--hoverable': content.hover })}>
      <div className="Image-primary">
        <img
          className={`Image-img u-max-width-${content.maxWidth || 100}`}
          src={getSource(content.type, content.url, clientSettings.cdnRootUrl)}
          />
        <div
          className="Image-copyrightInfo"
          dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(content.text || '') }}
          />
      </div>
      {hover}
    </div>
  );
}

ImageDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, ImageDisplay);

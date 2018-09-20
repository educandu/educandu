const React = require('react');
const ClientSettings = require('../../../bootstrap/client-settings');
const PropTypes = require('prop-types');
const { inject } = require('../../../components/container-context.jsx');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');

function AudioDisplay({ content, clientSettings, githubFlavoredMarkdown }) {

  const html = githubFlavoredMarkdown.render(content.text || '');

  let src;
  switch (content.type) {
    case 'external':
      src = content.url || null;
      break;
    case 'internal':
      src = content.url ? `${clientSettings.cdnRootUrl}/${content.url}` : null;
      break;
    default:
      src = null;
      break;
  }

  return (
    <div className="Audio">
      <div className="Audio-playerContainer">
        <audio src={src} controls />
      </div>
      <div className="Audio-copyrightInfo" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

AudioDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AudioDisplay);

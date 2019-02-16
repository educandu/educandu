const React = require('react');
const PropTypes = require('prop-types');
const ReactPlayer = require('react-player').default;
const ClientSettings = require('../../../bootstrap/client-settings');
const { inject } = require('../../../components/container-context.jsx');
const GithubFlavoredMarkdown = require('../../../common/github-flavored-markdown');
const { sectionDisplayProps, clientSettingsProps } = require('../../../ui/default-prop-types');

function VideoDisplay({ content, clientSettings, githubFlavoredMarkdown }) {

  const html = githubFlavoredMarkdown.render(content.text || '');
  const aspectRatio = content.aspectRatio || { h: 16, v: 9 };
  const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;
  const width = content.width || 100;


  let url;
  switch (content.type) {
    case 'internal':
      url = content.url ? `${clientSettings.cdnRootUrl}/${content.url}` : null;
      break;
    default:
      url = content.url || null;
      break;
  }

  const playerContainer = url ? (
    <div className="Video-playerContainerOuter">
      <div className={`Video-playerContainerInner u-width-${width}`}>
        <div className="Video-playerOuter" style={{ paddingTop }}>
          <ReactPlayer
            className="Video-playerInner"
            url={url}
            width="100%"
            height="100%"
            controls
            />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="Video">
      {playerContainer}
      <div className="Video-text" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps,
  ...clientSettingsProps,
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired
};

module.exports = inject({
  clientSettings: ClientSettings,
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, VideoDisplay);

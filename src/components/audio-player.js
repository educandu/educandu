const React = require('react');
const PropTypes = require('prop-types');
const { inject } = require('./container-context');
const GithubFlavoredMarkdown = require('../common/github-flavored-markdown');

function AudioPlayer({ soundUrl, legendHtml, githubFlavoredMarkdown }) {
  return (
    <div className="AudioPlayer">
      <div className="AudioPlayer-player">
        <audio src={soundUrl} controls />
      </div>
      <div
        className="AudioPlayer-legend"
        dangerouslySetInnerHTML={{ __html: githubFlavoredMarkdown.render(legendHtml || '') }}
        />
    </div>
  );
}

AudioPlayer.propTypes = {
  githubFlavoredMarkdown: PropTypes.instanceOf(GithubFlavoredMarkdown).isRequired,
  legendHtml: PropTypes.string,
  soundUrl: PropTypes.string
};

AudioPlayer.defaultProps = {
  legendHtml: '',
  soundUrl: ''
};

module.exports = inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AudioPlayer);

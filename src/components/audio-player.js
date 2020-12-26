import React from 'react';
import PropTypes from 'prop-types';
import { inject } from './container-context';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown';

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

export default inject({
  githubFlavoredMarkdown: GithubFlavoredMarkdown
}, AudioPlayer);

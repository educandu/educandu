import React from 'react';
import PropTypes from 'prop-types';
import { useService } from './container-context.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';

function AudioPlayer({ soundUrl, legendHtml }) {
  const githubFlavoredMarkdown = useService(GithubFlavoredMarkdown);
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
  legendHtml: PropTypes.string,
  soundUrl: PropTypes.string
};

AudioPlayer.defaultProps = {
  legendHtml: '',
  soundUrl: ''
};

export default AudioPlayer;

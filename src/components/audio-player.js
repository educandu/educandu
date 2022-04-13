import React from 'react';
import PropTypes from 'prop-types';
import Markdown from './markdown.js';

function AudioPlayer({ soundUrl, legendMarkdown }) {
  return (
    <div className="AudioPlayer">
      <div className="AudioPlayer-player">
        <audio src={soundUrl} controls />
      </div>
      <div className="AudioPlayer-legend">
        <Markdown>{legendMarkdown}</Markdown>
      </div>
    </div>
  );
}

AudioPlayer.propTypes = {
  legendMarkdown: PropTypes.string,
  soundUrl: PropTypes.string
};

AudioPlayer.defaultProps = {
  legendMarkdown: '',
  soundUrl: ''
};

export default AudioPlayer;

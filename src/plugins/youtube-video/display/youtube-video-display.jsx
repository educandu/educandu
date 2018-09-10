const React = require('react');
const YouTubeEmbed = require('react-youtube-embed');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function YoutubeVideoDisplay(props) {
  const { content } = props;
  return (
    <div className="YoutubeVideo">
      <div className={`YoutubeVideo-videoWrapper u-max-width-${content.maxWidth || 100}`}>
        {content.videoId && <YouTubeEmbed id={content.videoId} />}
      </div>
    </div>
  );
}

YoutubeVideoDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = YoutubeVideoDisplay;

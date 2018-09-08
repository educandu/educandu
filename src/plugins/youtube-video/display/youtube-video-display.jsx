const url = require('url');
const React = require('react');
const YouTubeEmbed = require('react-youtube-embed');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function parseVideoId(urlString) {
  const videoId = urlString && url.parse(urlString, true).query.v;
  return videoId || null;
}

function YoutubeVideoDisplay(props) {
  const { content } = props;
  const videoId = parseVideoId(content.url);

  return (
    <div className="YoutubeVideo">
      <div className={`YoutubeVideo-videoWrapper u-max-width-${content.maxWidth || 100}`}>
        {videoId && <YouTubeEmbed id={videoId} />}
      </div>
    </div>
  );
}

YoutubeVideoDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = YoutubeVideoDisplay;

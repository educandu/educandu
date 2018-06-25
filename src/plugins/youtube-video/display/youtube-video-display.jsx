const React = require('react');
const videojs = require('video.js');
const PropTypes = require('prop-types');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

require('videojs-youtube');

class YoutubeVideoContentDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.player = null;
    this.videoElementRef = React.createRef();
  }

  componentDidMount() {
    const { content } = this.props;

    this.player = videojs(this.videoElementRef.current, {
      sources: [
        {
          src: content.url,
          type: 'video/youtube'
        }
      ],
      techOrder: ['youtube'],
      controls: true,
      fluid: true
    });
  }

  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
  }

  render() {
    const { content } = this.props;
    return (
      <div className="YoutubeVideo">
        <div className={`YoutubeVideo-videoWrapper u-max-width-${content.maxWidth || 100}`}>
          <video className="YoutubeVideo-video video-js vjs-default-skin" ref={this.videoElementRef} />
        </div>
      </div>
    );
  }
}

YoutubeVideoContentDisplay.propTypes = {
  ...sectionDisplayProps
};

// Wrapper:
/* eslint react/no-multi-comp: 0 */

function YoutubeVideoDisplay({ preferredLanguages, section }) {
  const language = preferredLanguages[0];
  const content = section.content[language];

  return (
    <YoutubeVideoContentDisplay content={content} language={language} />
  );
}

YoutubeVideoDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = YoutubeVideoDisplay;

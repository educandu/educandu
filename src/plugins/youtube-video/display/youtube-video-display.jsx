const React = require('react');
const videojs = require('video.js');
const PropTypes = require('prop-types');

require('videojs-youtube');

class YoutubeVideoDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.videoElement = React.createRef();
  }

  componentDidMount() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];

    videojs(this.videoElement.current, {
      sources: [
        {
          src: data.url,
          type: 'video/youtube'
        }
      ],
      techOrder: ['youtube'],
      controls: true,
      fluid: true
    });
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const { preferredLanguages, section } = this.props;
    const data = section.content[preferredLanguages[0]];
    return (
      <div className="YoutubeVideo">
        <div className={`YoutubeVideo-videoWrapper u-max-width-${data.maxWidth || 100}`}>
          <video className="video-js vjs-default-skin" ref={this.videoElement} />
        </div>
      </div>
    );
  }
}

YoutubeVideoDisplay.propTypes = {
  preferredLanguages: PropTypes.arrayOf(PropTypes.string).isRequired,
  section: PropTypes.shape({
    content: PropTypes.object
  }).isRequired
};

module.exports = YoutubeVideoDisplay;

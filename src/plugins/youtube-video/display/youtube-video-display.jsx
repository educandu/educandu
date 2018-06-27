const React = require('react');
const videojs = require('video.js');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

require('videojs-youtube');

class YoutubeVideoDisplay extends React.Component {
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

YoutubeVideoDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = YoutubeVideoDisplay;

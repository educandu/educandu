const YoutubeVideoDisplay = require('./display/youtube-video-display.jsx');

class YoutubeVideo {
  static get typeName() { return 'youtube-video'; }

  getDisplayComponent() {
    return YoutubeVideoDisplay;
  }
}

module.exports = YoutubeVideo;

const videojs = require('video.js');
require('videojs-youtube');

class YoutubeVideo {
  static get typeName() { return 'youtube-video'; }

  constructor(section, parentElement) {
    this.section = section;
    this.parentElement = parentElement;
  }

  init() {
    videojs(this.parentElement.querySelector('video'), {
      sources: [
        {
          src: this.section.content.de.url,
          type: 'video/youtube'
        }
      ],
      techOrder: ['youtube'],
      controls: true,
      fluid: true
    });
  }
}

module.exports = YoutubeVideo;

const { encode } = require('he');

function renderSection(content) {
  return `
    <div class="YoutubeVideo">
      <div class="YoutubeVideo-videoWrapper" style="max-width: ${encode(content.maxWidth) || '100%'};">
        <video class="video-js vjs-default-skin"></video>
      </div>
    </div>`;
}

class YoutubeVideo {
  static get typeName() { return 'youtube-video'; }

  constructor(section) {
    this.section = section;
  }

  render() {
    return Object.keys(this.section.content).reduce((result, key) => {
      result[key] = renderSection(this.section.content[key]);
      return result;
    }, {});
  }
}

module.exports = YoutubeVideo;

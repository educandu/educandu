const YoutubeVideoEditor = require('./editing/youtube-video-editor.jsx');

class YoutubeVideo {
  static get typeName() { return 'youtube-video'; }

  getEditorComponent() {
    return YoutubeVideoEditor;
  }
}

module.exports = YoutubeVideo;

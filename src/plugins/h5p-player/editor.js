const H5pPlayerEditor = require('./editing/h5p-player-editor.jsx');

class H5pPlayer {
  static get typeName() { return 'h5p-player'; }

  getEditorComponent() {
    return H5pPlayerEditor;
  }
}

module.exports = H5pPlayer;

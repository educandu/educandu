const MarkdownEditor = require('./editing/markdown-editor');

class Markdown {
  static get typeName() { return 'markdown'; }

  getEditorComponent() {
    return MarkdownEditor;
  }
}

module.exports = Markdown;

import MarkdownEditor from './editing/markdown-editor.js';

class Markdown {
  static get typeName() { return 'markdown'; }

  getEditorComponent() {
    return MarkdownEditor;
  }
}

export default Markdown;

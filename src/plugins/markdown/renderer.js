import MarkdownDisplay from './display/markdown-display.js';

class Markdown {
  static get typeName() { return 'markdown'; }

  getDisplayComponent() {
    return MarkdownDisplay;
  }
}

export default Markdown;

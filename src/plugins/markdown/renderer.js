import MarkdownDisplay from './display/markdown-display';

class Markdown {
  static get typeName() { return 'markdown'; }

  getDisplayComponent() {
    return MarkdownDisplay;
  }
}

export default Markdown;

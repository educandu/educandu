const MarkdownDisplay = require('./display/markdown-display');

class Markdown {
  static get typeName() { return 'markdown'; }

  getDisplayComponent() {
    return MarkdownDisplay;
  }
}

module.exports = Markdown;

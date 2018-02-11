const MarkdownIt = require('markdown-it');
const gfm = new MarkdownIt();

class Markdown {
  renderHtml(section) {
    return gfm.render(section.content);
  }
}

module.exports = Markdown;

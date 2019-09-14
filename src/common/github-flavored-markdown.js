const MarkdownIt = require('markdown-it');

module.exports = class GithubFlavoredMarkdown {
  constructor() {
    this._gfm = new MarkdownIt();
  }

  render(markdown) {
    return this._gfm.render(markdown);
  }

  renderInline(markdown) {
    return this._gfm.renderInline(markdown);
  }
};

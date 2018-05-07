const MarkdownIt = require('markdown-it');
const gfm = new MarkdownIt();

class Markdown {
  static get typeName() { return 'markdown'; }

  render(section) {
    return Object.keys(section.content).reduce((result, key) => {
      result[key] = gfm.render(section.content[key]);
      return result;
    }, {});
  }
}

module.exports = Markdown;

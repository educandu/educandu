const MarkdownIt = require('markdown-it');
const gfm = new MarkdownIt();

class Markdown {
  static get typeName() { return 'markdown'; }

  constructor(section) {
    this.section = section;
  }

  render() {
    return Object.keys(this.section.content).reduce((result, key) => {
      result[key] = gfm.render(this.section.content[key]);
      return result;
    }, {});
  }
}

module.exports = Markdown;

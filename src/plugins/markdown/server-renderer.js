const GithubFlavoredMarkdown = require('../../common/github-flavored-markdown');

class Markdown {
  static get typeName() { return 'markdown'; }

  static inject() { return [GithubFlavoredMarkdown]; }

  constructor(markdown, section) {
    this.markdown = markdown;
    this.section = section;
  }

  render() {
    return Object.keys(this.section.content).reduce((result, key) => {
      result[key] = this.markdown.render(this.section.content[key]);
      return result;
    }, {});
  }
}

module.exports = Markdown;

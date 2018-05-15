class Markdown {
  static get typeName() { return 'markdown'; }

  constructor(section, parentElement) {
    this.section = section;
    this.parentElement = parentElement;
  }

  init() {}
}

module.exports = Markdown;

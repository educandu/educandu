import cloneDeep from '../../utils/clone-deep.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

export default class Markdown {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'markdown'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'markdown';
  }

  getName(t) {
    return t('markdown:name');
  }

  getDefaultContent() {
    return {
      text: ''
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text || '');
  }
}

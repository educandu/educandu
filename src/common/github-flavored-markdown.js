import MarkdownIt from 'markdown-it';
import memoizeLast from '../utils/memoize-last';

const gfm = new MarkdownIt();
const render = memoizeLast(s => gfm.render(s), 1000, s => s);
const renderInline = memoizeLast(s => gfm.renderInline(s), 1000, s => s);

class GithubFlavoredMarkdown {
  render(markdown) {
    return render(markdown);
  }

  renderInline(markdown) {
    return renderInline(markdown);
  }
}

export default GithubFlavoredMarkdown;

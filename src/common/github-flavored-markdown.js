import memoizee from 'memoizee';
import MarkdownIt from 'markdown-it';

const MAX_MEMOIZED_VALUES = 1000;

const gfm = new MarkdownIt();
const render = memoizee(gfm.render.bind(gfm), { max: MAX_MEMOIZED_VALUES });
const renderInline = memoizee(gfm.renderInline.bind(gfm), { max: MAX_MEMOIZED_VALUES });

class GithubFlavoredMarkdown {
  render(markdown) {
    return render(markdown);
  }

  renderInline(markdown) {
    return renderInline(markdown);
  }
}

export default GithubFlavoredMarkdown;

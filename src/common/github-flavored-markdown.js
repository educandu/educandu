import memoizee from 'memoizee';
import MarkdownIt from 'markdown-it';
import replaceLink from 'markdown-it-replace-link';

const getGfmForCdnRootUrl = memoizee(cdnRootUrl => {
  let gfm;
  if (cdnRootUrl) {
    gfm = new MarkdownIt({
      replaceLink: link => link.startsWith('cdn://') ? `${cdnRootUrl}/${link.substr(6)}` : link
    });
    gfm.use(replaceLink);
  } else {
    gfm = new MarkdownIt();
  }

  return gfm;
});
class GithubFlavoredMarkdown {
  render(markdown, { cdnRootUrl } = {}) {
    return getGfmForCdnRootUrl(cdnRootUrl).render(markdown);
  }

  renderInline(markdown, { cdnRootUrl } = {}) {
    return getGfmForCdnRootUrl(cdnRootUrl).renderInline(markdown);
  }

  extractCdnResources(markdown) {
    const linkSet = new Set();
    const extractor = new MarkdownIt({
      replaceLink: link => {
        if (link.startsWith('cdn://')) {
          linkSet.add(link);
        }
        return link;
      }
    });
    extractor.use(replaceLink);
    extractor.render(markdown);
    return [...linkSet].map(link => link.substr(6));
  }
}

export default GithubFlavoredMarkdown;

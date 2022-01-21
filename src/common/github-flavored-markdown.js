import MarkdownIt from 'markdown-it';
import { escapeHtml } from '../utils/string-utils.js';

const audioUrlPattern = new RegExp(`\\.(${['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav'].join('|')})$`, 'i');
const videoUrlPattern = new RegExp(`\\.(${['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg'].join('|')})$`, 'i');

function getMediaType(url) {
  if (audioUrlPattern.test(url)) {
    return 'audio';
  }
  if (videoUrlPattern.test(url)) {
    return 'video';
  }
  return 'image';
}

function educanduFeatures(md) {
  md.core.ruler.after('inline', 'educandu-features', state => {
    const { cdnRootUrl, renderMedia, collectCdnUrl } = state.env;

    const tokensToProcess = state.tokens
      .filter(parentToken => parentToken.type === 'inline')
      .flatMap(parentToken => parentToken.children || [])
      .filter(childToken => childToken.type === 'link_open' || childToken.type === 'image');

    for (const token of tokensToProcess) {
      const attrName = token.type === 'link_open' ? 'href' : 'src';
      let targetUrl = token.attrGet(attrName) || '';
      if (targetUrl.startsWith('cdn://')) {
        collectCdnUrl?.(targetUrl.slice(6));
        targetUrl = (cdnRootUrl || 'cdn:/') + targetUrl.slice(5);
        token.attrSet(attrName, targetUrl);
      }
      if (renderMedia && token.type === 'image' && targetUrl) {
        const mediaType = getMediaType(targetUrl);
        if (mediaType === 'audio' || mediaType === 'video') {
          token.type = 'media';
          token.tag = mediaType;
          token.attrs = [['src', targetUrl], ['controls']];
          token.children = null;
          token.content = null;
        }
      }
    }

    return false;
  });

  md.renderer.rules.media = (tokens, index) => {
    const token = tokens[index];

    const attributes = token.attrs.reduce((accu, [name, value]) => {
      return typeof value !== 'undefined' && value !== null
        ? `${accu} ${escapeHtml(name)}="${escapeHtml(value)}"`
        : `${accu} ${escapeHtml(name)}`;
    }, '');

    return `<${token.tag}${attributes}></${token.tag}>`;
  };
}

const gfm = new MarkdownIt().use(educanduFeatures);

class GithubFlavoredMarkdown {
  render(markdown, { cdnRootUrl, renderMedia } = {}) {
    return gfm.render(markdown, { cdnRootUrl, renderMedia });
  }

  renderInline(markdown, { cdnRootUrl, renderMedia } = {}) {
    return gfm.renderInline(markdown, { cdnRootUrl, renderMedia });
  }

  extractCdnResources(markdown) {
    const linkSet = new Set();
    gfm.render(markdown, { collectCdnUrl: link => linkSet.add(link) });
    return [...linkSet];
  }
}

export default GithubFlavoredMarkdown;

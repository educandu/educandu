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

    state.tokens.filter(parentToken => parentToken.type === 'inline').forEach(parentToken => {
      parentToken.children?.forEach(token => {
        if (token.type === 'link_open' || token.type === 'image') {
          let targetUrl = null;
          const attrToReplace = token.type === 'link_open' ? 'href' : 'src';
          token.attrs.filter(attr => attr[0] === attrToReplace).forEach(attr => {
            if (attr[1].startsWith('cdn://')) {
              collectCdnUrl?.(attr[1].slice(6));
              attr[1] = (cdnRootUrl || 'cdn:/') + attr[1].slice(5);
            }
            targetUrl = attr[1];
          });
          if (renderMedia && token.type === 'image' && targetUrl) {
            const mediaType = getMediaType(targetUrl);
            if (mediaType === 'audio' || mediaType === 'video') {
              token.type = 'media';
              token.tag = mediaType;
              token.attrs = [...token.attrs.filter(([name]) => name === 'src'), ['controls']];
              token.children = null;
              token.content = null;
            }
          }
        }
      });
    });

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

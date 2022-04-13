import MarkdownIt from 'markdown-it';
import { escapeHtml } from '../utils/string-utils.js';

const audioUrlPattern = new RegExp(`\\.(${['aac', 'm4a', 'mp3', 'oga', 'ogg', 'wav'].join('|')})$`, 'i');
const videoUrlPattern = new RegExp(`\\.(${['mp4', 'm4v', 'ogv', 'webm', 'mpg', 'mpeg'].join('|')})$`, 'i');

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfHyperlinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleHyperlinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

const getMediaType = url => {
  if (audioUrlPattern.test(url)) {
    return 'audio';
  }
  if (videoUrlPattern.test(url)) {
    return 'video';
  }
  return 'image';
};

const overrideRenderer = (md, tokenType, targetAttributeName, allowMediaRendering) => {
  // Remember original renderer, if overridden, or proxy to default renderer
  const originalRender = md.renderer.rules[tokenType]
    || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options, env, self));

  md.renderer.rules[tokenType] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    let targetUrl = token.attrGet(targetAttributeName) || '';
    if (targetUrl.startsWith('cdn://')) {
      env.collectCdnUrl?.(targetUrl.slice(6));
      targetUrl = (env.cdnRootUrl || 'cdn:/') + targetUrl.slice(5);
      token.attrSet(targetAttributeName, targetUrl);
    }

    if (env.renderMedia && allowMediaRendering && targetUrl) {
      const mediaType = getMediaType(targetUrl);
      if (mediaType === 'audio' || mediaType === 'video') {
        return `<${mediaType} src="${escapeHtml(targetUrl)}" controls></${mediaType}>`;
      }
    }

    // Pass token to original renderer
    return originalRender(tokens, idx, options, env, self);
  };
};

function educanduFeatures(md) {
  overrideRenderer(md, 'link_open', 'href', false);
  overrideRenderer(md, 'image', 'src', true);
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
    if (!markdown) {
      return [];
    }

    const linkSet = new Set();
    gfm.render(markdown, { collectCdnUrl: link => {
      if (link) {
        linkSet.add(link);
      }
    } });
    return [...linkSet];
  }

  redactCdnResources(markdown, cb) {
    if (!markdown) {
      return markdown;
    }

    const redact = url => {
      if (url.startsWith('cdn://')) {
        const pathOnly = url.slice(6);
        if (pathOnly) {
          const redactedPath = cb(pathOnly);
          return redactedPath ? `cdn://${redactedPath}` : '';
        }
      }

      return url;
    };

    return markdown
      .replace(imageInsideOfHyperlinkPattern, (_match, g1, g2, g3, g4, g5) => `${g1}${redact(g2)}${g3}${redact(g4)}${g5}`)
      .replace(simpleHyperlinkOrImagePattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`);
  }
}

export default GithubFlavoredMarkdown;

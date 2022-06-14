import MarkdownIt from 'markdown-it';
import { escapeHtml } from '../utils/string-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import { getResourceType } from '../utils/resource-utils.js';

const CDN_URL_PREFIX = 'cdn://';

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfHyperlinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleHyperlinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

const overrideRenderer = (md, tokenType, targetAttributeName, allowMediaRendering) => {
  // Remember original renderer, if overridden, or proxy to default renderer
  const originalRender = md.renderer.rules[tokenType]
    || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options, env, self));

  md.renderer.rules[tokenType] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    let targetUrl = token.attrGet(targetAttributeName) || '';
    if (targetUrl.startsWith(CDN_URL_PREFIX)) {
      const targetUrlPath = targetUrl.slice(CDN_URL_PREFIX.length);
      env.collectCdnUrl?.(targetUrlPath);
      targetUrl = (env.cdnRootUrl ? `${env.cdnRootUrl}/` : CDN_URL_PREFIX) + targetUrlPath;
      token.attrSet(targetAttributeName, targetUrl);
    }

    if (env.renderMedia && allowMediaRendering && targetUrl) {
      const resourceType = getResourceType(targetUrl);
      if (resourceType === RESOURCE_TYPE.audio || resourceType === RESOURCE_TYPE.video) {
        return `<${resourceType} src="${escapeHtml(targetUrl)}" controls></${resourceType}>`;
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

const markdownBlock = new MarkdownIt()
  .use(educanduFeatures);

const markdownInline = new MarkdownIt('zero')
  .enable(['text', 'escape', 'emphasis', 'link', 'autolink'])
  .use(educanduFeatures);

class GithubFlavoredMarkdown {
  render(markdown, { cdnRootUrl, renderMedia } = {}) {
    return markdownBlock.render(markdown, { cdnRootUrl, renderMedia });
  }

  renderInline(markdown, { cdnRootUrl, renderMedia } = {}) {
    return markdownInline.renderInline(markdown, { cdnRootUrl, renderMedia });
  }

  extractCdnResources(markdown) {
    if (!markdown) {
      return [];
    }

    const linkSet = new Set();
    markdownBlock.render(markdown, { collectCdnUrl: link => {
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
      if (url.startsWith(CDN_URL_PREFIX)) {
        const pathOnly = url.slice(CDN_URL_PREFIX.length);
        if (pathOnly) {
          const redactedPath = cb(pathOnly);
          return redactedPath ? `${CDN_URL_PREFIX}${redactedPath}` : '';
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

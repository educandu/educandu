import MarkdownIt from 'markdown-it';
import slugify from '@sindresorhus/slugify';
import markdownItAnchor from 'markdown-it-anchor';
import { escapeHtml } from '../utils/string-utils.js';
import { RESOURCE_TYPE } from '../domain/constants.js';
import { getResourceType } from '../utils/resource-utils.js';
import { getAccessibleUrl, isPortableCdnUrl, getCdnPath } from '../utils/source-utils.js';

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfLinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleLinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: <cdn://image.png>
const autoLinkPattern = /(<)([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^<>]*)(>)/g;

const overrideRenderer = (md, tokenType, targetAttributeName, allowMediaRendering) => {
  // Remember original renderer, if overridden, or proxy to default renderer
  const originalRender = md.renderer.rules[tokenType]
    || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options, env, self));

  md.renderer.rules[tokenType] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const nextToken = tokens[idx + 1];

    let targetUrl = token.attrGet(targetAttributeName) || '';
    if (isPortableCdnUrl(targetUrl)) {
      const isNonEmptyCdnUrl = !!getCdnPath({ url: targetUrl });

      if (isNonEmptyCdnUrl) {
        env.collectCdnUrl?.(targetUrl);
      }

      targetUrl = getAccessibleUrl({ url: targetUrl, cdnRootUrl: env.cdnRootUrl });
      token.attrSet(targetAttributeName, targetUrl);
      if (token.markup === 'autolink') {
        nextToken.content = targetUrl;
      }
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

const markdownBlockWithAnchors = new MarkdownIt()
  .use(markdownItAnchor, {
    slugify,
    tabIndex: false,
    callback: token => {
      token.attrSet('data-header', 'true');
    },
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      space: '',
      symbol: '',
      class: 'u-hidden',
      placement: 'before'
    })
  })
  .use(educanduFeatures);

const markdownInline = new MarkdownIt('zero')
  .enable(['text', 'escape', 'emphasis', 'link', 'autolink'])
  .use(educanduFeatures);

class GithubFlavoredMarkdown {
  render(markdown, { cdnRootUrl, renderMedia, renderAnchors } = {}) {
    return renderAnchors
      ? markdownBlockWithAnchors.render(markdown, { cdnRootUrl, renderMedia })
      : markdownBlock.render(markdown, { cdnRootUrl, renderMedia });
  }

  renderInline(markdown, { cdnRootUrl } = {}) {
    return markdownInline.renderInline(markdown, { cdnRootUrl });
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

  redactCdnResources(markdown, redactionCallback) {
    if (!markdown) {
      return markdown;
    }

    const redact = url => {
      const isRedactableUrl = isPortableCdnUrl(url) && !!getCdnPath({ url });
      if (isRedactableUrl) {
        return redactionCallback(url);
      }

      return url;
    };

    return markdown
      .replace(imageInsideOfLinkPattern, (_match, g1, g2, g3, g4, g5) => `${g1}${redact(g2)}${g3}${redact(g4)}${g5}`)
      .replace(simpleLinkOrImagePattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`)
      .replace(autoLinkPattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`);
  }
}

export default GithubFlavoredMarkdown;

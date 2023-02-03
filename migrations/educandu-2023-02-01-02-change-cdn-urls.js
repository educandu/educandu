import escapeStringRegexp from 'escape-string-regexp';

const CDN_URL_PREFIX = 'cdn://';
const OLD_ROOMS_CDN_PREFIX = 'cdn://rooms/';
const OLD_MEDIA_CDN_PREFIX = 'cdn://media/';

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfLinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleLinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: <cdn://image.png>
const autoLinkPattern = /(<)([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^<>]*)(>)/g;

export function isPortableCdnUrl(url) {
  return url.startsWith(CDN_URL_PREFIX);
}

export function getCdnPath({ url = '', cdnRootUrl = '' } = { url: '', cdnRootUrl: '' }) {
  return url
    .replace(new RegExp(`^${escapeStringRegexp(cdnRootUrl)}/?`), '')
    .replace(new RegExp(`^${escapeStringRegexp(CDN_URL_PREFIX)}/?`), '');
}

const redactCdnResources = (markdown, redactionCallback) => {
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
};

const redactUrl = (url = '') => {
  if (url.startsWith(OLD_ROOMS_CDN_PREFIX)) {
    return url
      .replace(OLD_ROOMS_CDN_PREFIX, 'cdn://room-media/')
      .replace('/media/', '/');
  }
  if (url.startsWith(OLD_MEDIA_CDN_PREFIX)) {
    return url.replace(OLD_MEDIA_CDN_PREFIX, 'cdn://document-media/');
  }
  return url;
};

const redactMarkdown = (text = '') => {
  return redactCdnResources(text, url => redactUrl(url));
};

export default class Educandu_2023_02_01_02_change_cdn_urls {
  constructor(db) {
    this.db = db;
  }

  updateDoc(doc) {
    doc.cdnResources = doc.cdnResources.map(redactUrl);
    doc.sections = doc.sections.map(section => {
      if (!section.content) {
        return section;
      }

      switch (section.type) {
        case 'abc-notation':
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          break;
        case 'annotation':
          section.content.title = redactMarkdown(section.content.title);
          section.content.text = redactMarkdown(section.content.text);
          break;
        case 'audio':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          break;
        case 'audio-waveform':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          break;
        case 'catalog':
          for (const item of section.content.items) {
            item.image.sourceUrl = redactUrl(item.image.sourceUrl);
          }
          break;
        case 'ear-training':
          section.content.title = redactMarkdown(section.content.title);
          for (const test of section.content.tests) {
            if (test.sound) {
              test.sound.sourceUrl = redactUrl(test.sound.sourceUrl);
              test.sound.copyrightNotice = redactMarkdown(test.sound.copyrightNotice);
            }
            if (test.questionImage) {
              test.questionImage.sourceUrl = redactUrl(test.questionImage.sourceUrl);
              test.questionImage.copyrightNotice = redactMarkdown(test.questionImage.copyrightNotice);
            }
            if (test.answerImage) {
              test.answerImage.sourceUrl = redactUrl(test.answerImage.sourceUrl);
              test.answerImage.copyrightNotice = redactMarkdown(test.answerImage.copyrightNotice);
            }
          }
          break;
        case 'image':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          if (section.content.hoverEffect) {
            section.content.hoverEffect.sourceUrl = redactUrl(section.content.hoverEffect.sourceUrl);
            section.content.hoverEffect.copyrightNotice = redactMarkdown(section.content.hoverEffect.copyrightNotice);
          }
          if (section.content.revealEffect) {
            section.content.revealEffect.sourceUrl = redactUrl(section.content.revealEffect.sourceUrl);
            section.content.revealEffect.copyrightNotice = redactMarkdown(section.content.revealEffect.copyrightNotice);
          }
          break;
        case 'interactive-media':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          break;
        case 'markdown':
          section.content.text = redactMarkdown(section.content.text);
          break;
        case 'markdown-with-image':
          section.content.text = redactMarkdown(section.content.text);
          if (section.content.image) {
            section.content.image.sourceUrl = redactUrl(section.content.image.sourceUrl);
            section.content.image.copyrightNotice = redactMarkdown(section.content.image.copyrightNotice);
          }
          break;
        case 'matching-cards':
          for (const pair of section.content.tilePairs) {
            for (const tile of pair) {
              tile.text = redactMarkdown(tile.text);
              tile.sourceUrl = redactUrl(tile.sourceUrl);
            }
          }
          break;
        case 'media-analysis':
          section.content.mainTrack.sourceUrl = redactUrl(section.content.mainTrack.sourceUrl);
          section.content.mainTrack.copyrightNotice = redactMarkdown(section.content.mainTrack.copyrightNotice);
          for (const secondaryTrack of section.content.secondaryTracks) {
            secondaryTrack.sourceUrl = redactUrl(secondaryTrack.sourceUrl);
            secondaryTrack.copyrightNotice = redactMarkdown(secondaryTrack.copyrightNotice);
          }
          break;
        case 'media-slideshow':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          for (const chapter of section.content.chapters) {
            if (chapter.image) {
              chapter.image.sourceUrl = redactUrl(chapter.image.sourceUrl);
              chapter.image.copyrightNotice = redactMarkdown(chapter.image.copyrightNotice);
            }
          }
          break;
        case 'multitrack-media':
          section.content.mainTrack.sourceUrl = redactUrl(section.content.mainTrack.sourceUrl);
          section.content.mainTrack.copyrightNotice = redactMarkdown(section.content.mainTrack.copyrightNotice);
          for (const secondaryTrack of section.content.secondaryTracks) {
            secondaryTrack.sourceUrl = redactUrl(secondaryTrack.sourceUrl);
            secondaryTrack.copyrightNotice = redactMarkdown(secondaryTrack.copyrightNotice);
          }
          break;
        case 'music-xml-viewer':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          break;
        case 'pdf-viewer':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          break;
        case 'quick-tester':
          section.content.title = redactMarkdown(section.content.title);
          section.content.teaser = redactMarkdown(section.content.teaser);
          for (const test of section.content.tests) {
            test.question = redactMarkdown(test.question);
            test.answer = redactMarkdown(test.answer);
          }
          break;
        case 'table':
          for (const cell of section.content.cells) {
            cell.text = redactMarkdown(cell.text);
          }
          break;
        case 'table-of-contents':
          section.content.text = redactMarkdown(section.content.text);
          break;
        case 'video':
          section.content.sourceUrl = redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = redactMarkdown(section.content.copyrightNotice);
          if (section.content.posterImage) {
            section.content.posterImage.sourceUrl = redactUrl(section.content.posterImage.sourceUrl);
          }
          break;
        default:
          break;
      }

      return section;
    });
    return doc;
  }

  shouldUpdateDoc(doc) {
    return doc.cdnResources.some(url => url.startsWith(OLD_ROOMS_CDN_PREFIX) || url.startsWith(OLD_MEDIA_CDN_PREFIX));
  }

  async processCollection(collectionName) {
    const cursor = this.db.collection(collectionName).find({ $and: [{ cdnResources: { $ne: [] } }, { cdnResources: { $ne: null } }] });

    let counter = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      if (this.shouldUpdateDoc(doc)) {
        counter += 1;
        await this.updateDoc(doc);
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
      }
    }

    console.log(`Updated ${counter} ${collectionName}`);
  }

  async up() {
    await this.processCollection('documentRevisions');
    await this.processCollection('documents');
  }

  down() {
    throw new Error('Not supported');
  }
}

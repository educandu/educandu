const CDN_PORTABLE_URL_PREFIX = 'cdn://';
const CDN_ACCESSIBLE_URL_REGEX = /https:\/\/cdn.(elmu\.online|integration\.openmusic\.academy|staging\.openmusic\.academy|openmusic\.academy|)\//;

const OLD_ROOMS_CDN_PREFIX = 'cdn://rooms/';
const OLD_MEDIA_CDN_PREFIX = 'cdn://media/';

// Matches both URLs in e.g.: [![alt](cdn://image.png "image title")](cdn://some-target)
const imageInsideOfLinkPattern = /(\[!\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\)]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: ![alt](cdn://image.png "image title")
const simpleLinkOrImagePattern = /(!?\[[^\]]*\]\()(\S*?)((?:\s+[^)]*)?\s*\))(?!\])/g;

// Matches the URL in e.g.: <cdn://image.png>
const autoLinkPattern = /(<)([a-zA-Z][a-zA-Z0-9+.-]{1,31}:[^<>]*)(>)/g;

const redactUrlsInMarkdown = (markdown, redact) => {
  if (!markdown) {
    return markdown;
  }

  return markdown
    .replace(imageInsideOfLinkPattern, (_match, g1, g2, g3, g4, g5) => `${g1}${redact(g2)}${g3}${redact(g4)}${g5}`)
    .replace(simpleLinkOrImagePattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`)
    .replace(autoLinkPattern, (_match, g1, g2, g3) => `${g1}${redact(g2)}${g3}`);
};

const redactUrl = (url = '') => {
  let portableUrl = url;

  if (CDN_ACCESSIBLE_URL_REGEX.test(url)) {
    portableUrl = url.replace(CDN_ACCESSIBLE_URL_REGEX, CDN_PORTABLE_URL_PREFIX);
  }

  if (portableUrl.startsWith(OLD_ROOMS_CDN_PREFIX)) {
    portableUrl = portableUrl
      .replace(OLD_ROOMS_CDN_PREFIX, 'cdn://room-media/')
      .replace('/media/', '/');
  }

  if (portableUrl.startsWith(OLD_MEDIA_CDN_PREFIX)) {
    portableUrl = portableUrl.replace(OLD_MEDIA_CDN_PREFIX, 'cdn://document-media/');
  }

  return portableUrl;
};

const redactMarkdown = text => {
  let isRedacted = false;

  const redactUrlCallback = url => {
    const redactedUrl = redactUrl(url);
    if (!isRedacted && redactedUrl !== url) {
      isRedacted = true;
      console.log(`Redacted:\n  ${url}\n  ${redactedUrl}`);
    }
    return redactedUrl;
  };

  const redactedMarkdown = redactUrlsInMarkdown(text, redactUrlCallback);

  return {
    markdown: redactedMarkdown,
    isRedacted
  };
};

export default class Educandu_2023_02_08_02_change_accessible_cdn_urls_in_documents {
  constructor(db) {
    this.db = db;
  }

  updateDoc(doc) {
    let result;
    let isUpdated = false;

    doc.sections = doc.sections.map(section => {
      if (!section.content) {
        return section;
      }

      switch (section.type) {
        case 'abc-notation':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'annotation':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'audio':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'ear-training':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          for (const test of section.content.tests) {
            if (test.sound) {
              result = redactMarkdown(test.sound.copyrightNotice);
              if (result.isRedacted) {
                test.sound.copyrightNotice = result.markdown;
                isUpdated ||= result.isRedacted;
              }
            }
            if (test.questionImage) {
              result = redactMarkdown(test.questionImage.copyrightNotice);
              if (result.isRedacted) {
                test.questionImage.copyrightNotice = result.markdown;
                isUpdated ||= result.isRedacted;
              }
            }
            if (test.answerImage) {
              result = redactMarkdown(test.answerImage.copyrightNotice);
              if (result.isRedacted) {
                test.answerImage.copyrightNotice = result.markdown;
                isUpdated ||= result.isRedacted;
              }
            }
          }
          break;
        case 'image':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          if (section.content.hoverEffect) {
            result = redactMarkdown(section.content.hoverEffect.copyrightNotice);
            if (result.isRedacted) {
              section.content.hoverEffect.copyrightNotice = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          if (section.content.revealEffect) {
            result = redactMarkdown(section.content.revealEffect.copyrightNotice);
            if (result.isRedacted) {
              section.content.revealEffect.copyrightNotice = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'interactive-media':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'markdown':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'markdown-with-image':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          if (section.content.image) {
            result = redactMarkdown(section.content.image.copyrightNotice);
            if (result.isRedacted) {
              section.content.image.copyrightNotice = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'matching-cards':
          for (const pair of section.content.tilePairs) {
            for (const tile of pair) {
              result = redactMarkdown(tile.text);
              if (result.isRedacted) {
                tile.text = result.markdown;
                isUpdated ||= result.isRedacted;
              }
            }
          }
          break;
        case 'media-analysis':
          result = redactMarkdown(section.content.mainTrack.copyrightNotice);
          if (result.isRedacted) {
            section.content.mainTrack.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          for (const secondaryTrack of section.content.secondaryTracks) {
            result = redactMarkdown(secondaryTrack.copyrightNotice);
            if (result.isRedacted) {
              secondaryTrack.copyrightNotice = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'media-slideshow':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          for (const chapter of section.content.chapters) {
            if (chapter.image) {
              result = redactMarkdown(chapter.image.copyrightNotice);
              if (result.isRedacted) {
                chapter.image.copyrightNotice = result.markdown;
                isUpdated ||= result.isRedacted;
              }
            }
          }
          break;
        case 'multitrack-media':
          result = redactMarkdown(section.content.mainTrack.copyrightNotice);
          if (result.isRedacted) {
            section.content.mainTrack.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          for (const secondaryTrack of section.content.secondaryTracks) {
            result = redactMarkdown(secondaryTrack.copyrightNotice);
            if (result.isRedacted) {
              secondaryTrack.copyrightNotice = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'quick-tester':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          result = redactMarkdown(section.content.teaser);
          if (result.isRedacted) {
            section.content.teaser = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          for (const test of section.content.tests) {
            result = redactMarkdown(test.question);
            if (result.isRedacted) {
              test.question = result.markdown;
              isUpdated ||= result.isRedacted;
            }
            result = redactMarkdown(test.answer);
            if (result.isRedacted) {
              test.answer = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'table':
          for (const cell of section.content.cells) {
            result = redactMarkdown(cell.text);
            if (result.isRedacted) {
              cell.text = result.markdown;
              isUpdated ||= result.isRedacted;
            }
          }
          break;
        case 'table-of-contents':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        case 'video':
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated ||= result.isRedacted;
          }
          break;
        default:
          break;
      }

      return section;
    });

    return { doc, isUpdated };
  }

  async processCollection(collectionName) {
    const cursor = this.db.collection(collectionName).find({});

    let counter = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();

      const result = await this.updateDoc(doc);
      if (result.isUpdated) {
        counter += 1;
        await this.db.collection(collectionName).replaceOne({ _id: doc._id }, result.doc);
        console.log(`Updated ${collectionName} ${result.doc._id}`);
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

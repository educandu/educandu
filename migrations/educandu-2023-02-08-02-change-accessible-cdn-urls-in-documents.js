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

  const isRedacted = url !== portableUrl;

  if (isRedacted) {
    console.log(`Redacted:\n  ${url}\n  ${portableUrl}`);
  }

  return {
    url: portableUrl,
    isRedacted
  };
};

const redactMarkdown = text => {
  let isRedacted = false;

  const redactUrlCallback = url => {
    const result = redactUrl(url);
    if (result.isRedacted) {
      isRedacted = true;
    }
    return result.url;
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
            isUpdated = true;
          }
          break;
        case 'annotation':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated = true;
          }
          break;
        case 'audio':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          break;
        case 'audio-waveform':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          break;
        case 'catalog':
          for (const item of section.content.items) {
            result = redactUrl(item.image.sourceUrl);
            if (result.isRedacted) {
              item.image.sourceUrl = result.url;
              isUpdated = true;
            }
          }
          break;
        case 'ear-training':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated = true;
          }
          for (const test of section.content.tests) {
            if (test.sound) {
              result = redactUrl(test.sound.sourceUrl);
              if (result.isRedacted) {
                test.sound.sourceUrl = result.url;
                isUpdated = true;
              }
              result = redactMarkdown(test.sound.copyrightNotice);
              if (result.isRedacted) {
                test.sound.copyrightNotice = result.markdown;
                isUpdated = true;
              }
            }
            if (test.questionImage) {
              result = redactUrl(test.questionImage.sourceUrl);
              if (result.isRedacted) {
                test.questionImage.sourceUrl = result.url;
                isUpdated = true;
              }
              result = redactMarkdown(test.questionImage.copyrightNotice);
              if (result.isRedacted) {
                test.questionImage.copyrightNotice = result.markdown;
                isUpdated = true;
              }
            }
            if (test.answerImage) {
              result = redactUrl(test.answerImage.sourceUrl);
              if (result.isRedacted) {
                test.answerImage.sourceUrl = result.url;
                isUpdated = true;
              }
              result = redactMarkdown(test.answerImage.copyrightNotice);
              if (result.isRedacted) {
                test.answerImage.copyrightNotice = result.markdown;
                isUpdated = true;
              }
            }
          }
          break;
        case 'image':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          if (section.content.hoverEffect) {
            result = redactUrl(section.content.hoverEffect.sourceUrl);
            if (result.isRedacted) {
              section.content.hoverEffect.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(section.content.hoverEffect.copyrightNotice);
            if (result.isRedacted) {
              section.content.hoverEffect.copyrightNotice = result.markdown;
              isUpdated = true;
            }
          }
          if (section.content.revealEffect) {
            result = redactUrl(section.content.revealEffect.sourceUrl);
            if (result.isRedacted) {
              section.content.revealEffect.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(section.content.revealEffect.copyrightNotice);
            if (result.isRedacted) {
              section.content.revealEffect.copyrightNotice = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'interactive-media':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          break;
        case 'markdown':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated = true;
          }
          break;
        case 'markdown-with-image':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated = true;
          }
          if (section.content.image) {
            result = redactUrl(section.content.image.sourceUrl);
            if (result.isRedacted) {
              section.content.image.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(section.content.image.copyrightNotice);
            if (result.isRedacted) {
              section.content.image.copyrightNotice = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'matching-cards':
          for (const pair of section.content.tilePairs) {
            for (const tile of pair) {
              result = redactMarkdown(tile.text);
              if (result.isRedacted) {
                tile.text = result.markdown;
                isUpdated = true;
              }
              result = redactUrl(tile.sourceUrl);
              if (result.isRedacted) {
                tile.sourceUrl = result.url;
                isUpdated = true;
              }
            }
          }
          break;
        case 'media-analysis':
          result = redactUrl(section.content.mainTrack.sourceUrl);
          if (result.isRedacted) {
            section.content.mainTrack.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.mainTrack.copyrightNotice);
          if (result.isRedacted) {
            section.content.mainTrack.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          for (const secondaryTrack of section.content.secondaryTracks) {
            result = redactUrl(secondaryTrack.sourceUrl);
            if (result.isRedacted) {
              secondaryTrack.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(secondaryTrack.copyrightNotice);
            if (result.isRedacted) {
              secondaryTrack.copyrightNotice = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'media-slideshow':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          for (const chapter of section.content.chapters) {
            if (chapter.image) {
              result = redactUrl(chapter.image.sourceUrl);
              if (result.isRedacted) {
                chapter.image.sourceUrl = result.url;
                isUpdated = true;
              }
              result = redactMarkdown(chapter.image.copyrightNotice);
              if (result.isRedacted) {
                chapter.image.copyrightNotice = result.markdown;
                isUpdated = true;
              }
            }
          }
          break;
        case 'multitrack-media':
          result = redactUrl(section.content.mainTrack.sourceUrl);
          if (result.isRedacted) {
            section.content.mainTrack.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.mainTrack.copyrightNotice);
          if (result.isRedacted) {
            section.content.mainTrack.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          for (const secondaryTrack of section.content.secondaryTracks) {
            result = redactUrl(secondaryTrack.sourceUrl);
            if (result.isRedacted) {
              secondaryTrack.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(secondaryTrack.copyrightNotice);
            if (result.isRedacted) {
              secondaryTrack.copyrightNotice = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'music-xml-viewer':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          break;
        case 'pdf-viewer':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          break;
        case 'quick-tester':
          result = redactMarkdown(section.content.title);
          if (result.isRedacted) {
            section.content.title = result.markdown;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.teaser);
          if (result.isRedacted) {
            section.content.teaser = result.markdown;
            isUpdated = true;
          }
          for (const test of section.content.tests) {
            result = redactMarkdown(test.question);
            if (result.isRedacted) {
              test.question = result.markdown;
              isUpdated = true;
            }
            result = redactMarkdown(test.answer);
            if (result.isRedacted) {
              test.answer = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'table':
          for (const cell of section.content.cells) {
            result = redactMarkdown(cell.text);
            if (result.isRedacted) {
              cell.text = result.markdown;
              isUpdated = true;
            }
          }
          break;
        case 'table-of-contents':
          result = redactMarkdown(section.content.text);
          if (result.isRedacted) {
            section.content.text = result.markdown;
            isUpdated = true;
          }
          break;
        case 'video':
          result = redactUrl(section.content.sourceUrl);
          if (result.isRedacted) {
            section.content.sourceUrl = result.url;
            isUpdated = true;
          }
          result = redactMarkdown(section.content.copyrightNotice);
          if (result.isRedacted) {
            section.content.copyrightNotice = result.markdown;
            isUpdated = true;
          }
          if (section.content.posterImage) {
            result = redactUrl(section.content.posterImage.sourceUrl);
            if (result.isRedacted) {
              section.content.posterImage.sourceUrl = result.url;
              isUpdated = true;
            }
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

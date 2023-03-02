const CDN_MEDIA_LIBRARY_PREFIX = 'cdn://media-library/';
const CDN_DOCUMENT_MEDIA_REGEX = /cdn:\/\/document-media\/.+\//;

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

  if (CDN_DOCUMENT_MEDIA_REGEX.test(url)) {
    portableUrl = url.replace(CDN_DOCUMENT_MEDIA_REGEX, CDN_MEDIA_LIBRARY_PREFIX);
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

export default class Educandu_2023_02_28_01_migrate_document_media_to_media_library {
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
            result = redactUrl(item.link.sourceUrl);
            if (result.isRedacted) {
              item.link.sourceUrl = result.url;
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
          for (const track of section.content.tracks) {
            result = redactUrl(track.sourceUrl);
            if (result.isRedacted) {
              track.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(track.copyrightNotice);
            if (result.isRedacted) {
              track.copyrightNotice = result.markdown;
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
          for (const track of section.content.tracks) {
            result = redactUrl(track.sourceUrl);
            if (result.isRedacted) {
              track.sourceUrl = result.url;
              isUpdated = true;
            }
            result = redactMarkdown(track.copyrightNotice);
            if (result.isRedacted) {
              track.copyrightNotice = result.markdown;
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

  async processDocumentsCollection(collectionName) {
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

  async redactRoomDescription(room) {
    const result = await redactMarkdown(room.description);

    if (result.isRedacted) {
      // eslint-disable-next-line require-atomic-updates
      room.description = result.markdown;
    }

    return result.isRedacted;
  }

  async processRoomsCollection() {
    const cursor = this.db.collection('rooms').find({ $and: [{ description: { $ne: '' } }, { description: { $ne: null } }] });

    let counter = 0;
    while (await cursor.hasNext()) {
      const room = await cursor.next();
      const isRedacted = await this.redactRoomDescription(room);

      if (isRedacted) {
        counter += 1;
        await this.db.collection('rooms').replaceOne({ _id: room._id }, room);
        console.log(`Updated description for room ${room._id}`);
      }
    }

    console.log(`Updated ${counter} rooms`);
  }

  async redactUserIntroduction(user) {
    const result = await redactMarkdown(user.introduction);

    if (result.isRedacted) {
      // eslint-disable-next-line require-atomic-updates
      user.introduction = result.markdown;
    }

    return result.isRedacted;
  }

  async processSettingsCollection() {
    const homepagePresentation = await this.db.collection('settings').findOne({ _id: 'homepagePresentation' });

    if (!homepagePresentation) {
      return;
    }

    if (homepagePresentation.en?.videoSourceUrl) {
      homepagePresentation.en.videoSourceUrl = redactUrl(homepagePresentation.en.videoSourceUrl);
    }
    if (homepagePresentation.en?.posterImageSourceUrl) {
      homepagePresentation.en.posterImageSourceUrl = redactUrl(homepagePresentation.en.posterImageSourceUrl);
    }
    if (homepagePresentation.de?.videoSourceUrl) {
      homepagePresentation.de.videoSourceUrl = redactUrl(homepagePresentation.de.videoSourceUrl);
    }
    if (homepagePresentation.de?.posterImageSourceUrl) {
      homepagePresentation.de.posterImageSourceUrl = redactUrl(homepagePresentation.de.posterImageSourceUrl);
    }

    await this.db.collection('settings').replaceOne({ _id: 'homepagePresentation' }, homepagePresentation);

    console.log('Updated settings');
  }

  async up() {
    await this.processDocumentsCollection('documentRevisions');
    await this.processDocumentsCollection('documents');
    await this.processRoomsCollection();
    await this.processSettingsCollection();
  }

  down() {
    throw new Error('Not supported');
  }
}

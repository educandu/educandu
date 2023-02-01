import GithubFlavoredMarkdown from '../src/common/github-flavored-markdown.js';

const OLD_ROOMS_CDN_PREFIX = 'cdn://rooms/';
const OLD_MEDIA_CDN_PREFIX = 'cdn://media/';

export default class Educandu_2023_02_01_02_change_cdn_urls {
  constructor(db) {
    this.db = db;
    this.gfm = new GithubFlavoredMarkdown();
  }

  redactUrl(url = '') {
    if (url.startsWith(OLD_ROOMS_CDN_PREFIX)) {
      return url
        .replace(OLD_ROOMS_CDN_PREFIX, 'cdn://room-media/')
        .replace('/media/', '/');
    }
    if (url.startsWith(OLD_MEDIA_CDN_PREFIX)) {
      return url.replace(OLD_MEDIA_CDN_PREFIX, 'cdn://document-media/');
    }
    return url;
  }

  redactMarkdown(text = '') {
    return this.gfm.redactCdnResources(text, url => this.redactUrl(url));
  }

  updateDoc(doc) {
    doc.cdnResources = doc.cdnResources.forEach(this.redactUrl);

    for (const section of doc.sections) {
      if (!section.content) {
        return;
      }

      switch (section.type) {
        case 'abc-notation':
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          break;
        case 'annotation':
          section.content.title = this.redactMarkdown(section.content.title);
          section.content.text = this.redactMarkdown(section.content.text);
          break;
        case 'audio':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          break;
        case 'audio-waveform':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          break;
        case 'catalog':
          for (const item of section.content.items) {
            item.image.sourceUrl = this.redactUrl(item.image.sourceUrl);
          }
          break;
        case 'ear-training':
          section.content.title = this.redactMarkdown(section.content.title);
          for (const test of section.content.tests) {
            if (test.sound) {
              test.sound.sourceUrl = this.redactUrl(test.sound.sourceUrl);
              test.sound.copyrightNotice = this.redactMarkdown(test.sound.copyrightNotice);
            }
            if (test.questionImage) {
              test.questionImage.sourceUrl = this.redactUrl(test.questionImage.sourceUrl);
              test.questionImage.copyrightNotice = this.redactMarkdown(test.questionImage.copyrightNotice);
            }
            if (test.answerImage) {
              test.answerImage.sourceUrl = this.redactUrl(test.answerImage.sourceUrl);
              test.answerImage.copyrightNotice = this.redactMarkdown(test.answerImage.copyrightNotice);
            }
          }
          break;
        case 'image':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          if (section.content.hoverEffect) {
            section.content.hoverEffect.sourceUrl = this.redactUrl(section.content.hoverEffect.sourceUrl);
            section.content.hoverEffect.copyrightNotice = this.redactMarkdown(section.content.hoverEffect.copyrightNotice);
          }
          if (section.content.revealEffect) {
            section.content.revealEffect.sourceUrl = this.redactUrl(section.content.revealEffect.sourceUrl);
            section.content.revealEffect.copyrightNotice = this.redactMarkdown(section.content.revealEffect.copyrightNotice);
          }
          break;
        case 'interactive-media':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          break;
        case 'markdown':
          section.content.text = this.redactMarkdown(section.content.text);
          break;
        case 'markdown-with-image':
          section.content.text = this.redactMarkdown(section.content.text);
          if (section.content.image) {
            section.content.image.sourceUrl = this.redactUrl(section.content.image.sourceUrl);
            section.content.image.copyrightNotice = this.redactMarkdown(section.content.image.copyrightNotice);
          }
          break;
        case 'matching-cards':
          for (const pair of section.content.tilePairs) {
            for (const tile of pair) {
              tile.text = this.redactMarkdown(tile.text);
              tile.sourceUrl = this.redactUrl(tile.sourceUrl);
            }
          }
          break;
        case 'media-analysis':
          section.content.mainTrack.sourceUrl = this.redactUrl(section.content.mainTrack.sourceUrl);
          section.content.mainTrack.copyrightNotice = this.redactMarkdown(section.content.mainTrack.copyrightNotice);
          for (const secondaryTrack of section.content.secondaryTracks) {
            secondaryTrack.sourceUrl = this.redactUrl(secondaryTrack.sourceUrl);
            secondaryTrack.copyrightNotice = this.redactMarkdown(secondaryTrack.copyrightNotice);
          }
          break;
        case 'media-slideshow':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          for (const chapter of section.content.chapters) {
            if (chapter.image) {
              chapter.image.sourceUrl = this.redactUrl(chapter.image.sourceUrl);
              chapter.image.copyrightNotice = this.redactMarkdown(chapter.image.copyrightNotice);
            }
          }
          break;
        case 'multitrack-media':
          section.content.mainTrack.sourceUrl = this.redactUrl(section.content.mainTrack.sourceUrl);
          section.content.mainTrack.copyrightNotice = this.redactMarkdown(section.content.mainTrack.copyrightNotice);
          for (const secondaryTrack of section.content.secondaryTracks) {
            secondaryTrack.sourceUrl = this.redactUrl(secondaryTrack.sourceUrl);
            secondaryTrack.copyrightNotice = this.redactMarkdown(secondaryTrack.copyrightNotice);
          }
          break;
        case 'music-xml-viewer':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          break;
        case 'pdf-viewer':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          break;
        case 'quick-tester':
          section.content.title = this.redactMarkdown(section.content.title);
          section.content.teaser = this.redactMarkdown(section.content.teaser);
          for (const test of section.content.tests) {
            test.question = this.redactMarkdown(test.question);
            test.answer = this.redactMarkdown(test.answer);
          }
          break;
        case 'table':
          for (const cell of section.content.cells) {
            cell.text = this.redactMarkdown(cell.text);
          }
          break;
        case 'table-of-contents':
          section.content.text = this.redactMarkdown(section.content.text);
          break;
        case 'video':
          section.content.sourceUrl = this.redactUrl(section.content.sourceUrl);
          section.content.copyrightNotice = this.redactMarkdown(section.content.copyrightNotice);
          if (section.content.posterImage) {
            section.content.posterImage.sourceUrl = this.redactUrl(section.content.posterImage.sourceUrl);
          }
          break;
        default:
          break;
      }
    }
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

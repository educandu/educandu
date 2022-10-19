/* eslint-disable camelcase, no-console, no-await-in-loop, complexity */

import { EFFECT_TYPE } from '../src/plugins/image/constants.js';
import { MEDIA_ASPECT_RATIO } from '../src/domain/constants.js';
import { TEST_MODE } from '../src/plugins/ear-training/constants.js';

export default class Educandu_2022_09_07_02_streamline_nulls_in_plugins {
  constructor(db) {
    this.db = db;
  }

  tryUpdateSection(section) {
    let sectionWasUpdated = false;

    if (!section.content) {
      return sectionWasUpdated;
    }

    if (section.type === 'markdown' && 'renderMedia' in section.content) {
      // Delete superfluous property
      delete section.content.renderMedia;
      sectionWasUpdated = true;
    }

    if (section.type === 'annotation' && 'renderMedia' in section.content) {
      // Delete superfluous property
      delete section.content.renderMedia;
      sectionWasUpdated = true;
    }

    if (section.type === 'table' && 'renderMedia' in section.content) {
      // Delete superfluous property
      delete section.content.renderMedia;
      sectionWasUpdated = true;
    }

    if (section.type === 'interactive-media' && 'range' in section.content) {
      // Delete wrongly named property
      delete section.content.range;
      sectionWasUpdated = true;
    }

    if (section.type === 'image') {
      if (section.content.copyrightNotice === null) {
        // Convert null -> empty string
        section.content.copyrightNotice = '';
        sectionWasUpdated = true;
      }
      if (section.content.effect?.type === EFFECT_TYPE.clip && 'copyrightNotice' in section.content.effect) {
        // Delete superfluous property
        delete section.content.effect.copyrightNotice;
        sectionWasUpdated = true;
      }
    }

    if (section.type === 'audio') {
      if (section.content.sourceUrl === null) {
        // Convert null -> empty string
        section.content.sourceUrl = '';
        sectionWasUpdated = true;
      }
      if (section.content.copyrightNotice === null) {
        // Convert null -> empty string
        section.content.copyrightNotice = '';
        sectionWasUpdated = true;
      }
    }

    if (section.type === 'video') {
      if (section.content.sourceUrl === null) {
        // Convert null -> empty string
        section.content.sourceUrl = '';
        sectionWasUpdated = true;
      }
      if (section.content.copyrightNotice === null) {
        // Convert null -> empty string
        section.content.copyrightNotice = '';
        sectionWasUpdated = true;
      }
    }

    if (section.type === 'pdf-viewer') {
      if (section.content.sourceUrl === null) {
        // Convert null -> empty string
        section.content.sourceUrl = '';
        sectionWasUpdated = true;
      }
    }

    if (section.type === 'catalog') {
      for (const item of section.content.items) {
        // Ensure property
        if (!('documentId' in item.link)) {
          item.link.documentId = null;
          sectionWasUpdated = true;
        }
        // Convert empty string -> null
        if (item.link.documentId === '') {
          item.link.documentId = null;
          sectionWasUpdated = true;
        }
      }
    }

    if (section.type === 'ear-training') {
      for (const test of section.content.tests) {
        // Migrate leftover older data structure
        if ('startAbcCode' in test) {
          test.mode = TEST_MODE.abcCode;
          test.questionAbcCode = test.startAbcCode;
          test.answerAbcCode = test.fullAbcCode;
          delete test.startAbcCode;
          delete test.fullAbcCode;
          sectionWasUpdated = true;
        }
        // Ensure value
        if (!test.mode) {
          test.mode = TEST_MODE.image;
          sectionWasUpdated = true;
        }
        // Ensure object
        if (!test.sound) {
          test.sound = {
            sourceType: 'interal',
            sourceUrl: '',
            copyrightNotice: ''
          };
          sectionWasUpdated = true;
        }
        // Ensure object
        if (!test.questionImage) {
          test.questionImage = {
            sourceType: 'internal',
            sourceUrl: '',
            copyrightNotice: ''
          };
          sectionWasUpdated = true;
        }
        // Ensure object
        if (!test.answerImage) {
          test.answerImage = {
            sourceType: 'internal',
            sourceUrl: '',
            copyrightNotice: ''
          };
          sectionWasUpdated = true;
        }
        // Ensure value
        if (!test.questionAbcCode) {
          test.questionAbcCode = '';
          sectionWasUpdated = true;
        }
        // Ensure value
        if (!test.answerAbcCode) {
          test.answerAbcCode = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.sound.sourceUrl === null) {
          test.sound.sourceUrl = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.sound.copyrightNotice === null) {
          test.sound.copyrightNotice = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.questionImage.sourceUrl === null) {
          test.questionImage.sourceUrl = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.questionImage.copyrightNotice === null) {
          test.questionImage.copyrightNotice = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.answerImage.sourceUrl === null) {
          test.answerImage.sourceUrl = '';
          sectionWasUpdated = true;
        }
        // Convert null -> empty string
        if (test.answerImage.copyrightNotice === null) {
          test.answerImage.copyrightNotice = '';
          sectionWasUpdated = true;
        }
      }
    }

    if (section.type === 'anavis') {
      if (section.content.media?.aspectRatio?.h) {
        // Convert legacy AR object -> AR enum
        section.content.media.aspectRatio = section.content.media.aspectRatio.h === 4
          ? MEDIA_ASPECT_RATIO.fourToThree
          : MEDIA_ASPECT_RATIO.sixteenToNine;
        sectionWasUpdated = true;
      }
      for (const part of section.content.parts) {
        for (let i = 0; i < part.annotations.length; i += 1) {
          // Convert null -> empty string
          if (part.annotations[i] === null) {
            part.annotations[i] = '';
            sectionWasUpdated = true;
          }
        }
      }
    }

    return sectionWasUpdated;
  }

  async processCollection(collectionName) {
    const docsToUpdate = new Set();

    await this.db.collection(collectionName).find().forEach(doc => {
      for (const section of doc.sections) {
        const shouldUpdate = this.tryUpdateSection(section);
        if (shouldUpdate) {
          docsToUpdate.add(doc);
        }
      }
    });

    for (const doc of docsToUpdate) {
      console.log(`Updating ${collectionName} ${doc._id}`);
      await this.db.collection(collectionName).replaceOne({ _id: doc._id }, doc);
    }

    return docsToUpdate.size;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');
    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw new Error('Not implemented');
  }
}

/* eslint-disable no-await-in-loop, no-console */
import { updateAll } from './helpers.js';

const updateToNewContentStructure = content => {
  content.sourceType = content.type;
  delete content.type;
  content.sourceUrl = content.url;
  delete content.url;
  content.effect = null;

  if (content.hover) {
    content.effect = {
      ...content.hover,
      sourceType: content.hover.type,
      type: 'hover',
      sourceUrl: content.hover.url
    };

    delete content.effect.url;
  }

  delete content.hover;
};

const updateToOldContentStructure = content => {
  content.type = content.sourceType;
  delete content.sourceType;

  content.url = content.sourceUrl;
  delete content.sourceUrl;
  content.hover = null;

  if (content.effect?.type === 'hover') {
    content.hover = {
      ...content.effect,
      type: content.effect.sourceType,
      url: content.effect.sourceUrl
    };

    delete content.hover.sourceType;
    delete content.hover.sourceUrl;
  }

  delete content.effect;
};

class Migration2021100601 {
  constructor(db) {
    this.db = db;
  }

  async up() {
    await updateAll(this.db.collection('documents'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image' || !section.content) {
          return;
        }
        updateToNewContentStructure(section.content);
        console.log(`Updated document with id: ${doc._id}`);
      });
    });

    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image' || !section.content) {
          return;
        }
        updateToNewContentStructure(section.content);
        console.log(`Updated document revision with id: ${doc._id}`);
      });
    });
  }

  async down() {
    await updateAll(this.db.collection('documents'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image' || !section.content) {
          return;
        }
        updateToOldContentStructure(section.content);
        console.log(`Updated document with id: ${doc._id}`);
      });
    });

    await updateAll(this.db.collection('documentRevisions'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image' || !section.content) {
          return;
        }
        updateToOldContentStructure(section.content);
        console.log(`Updated document revision with id: ${doc._id}`);
      });
    });
  }
}

export default Migration2021100601;

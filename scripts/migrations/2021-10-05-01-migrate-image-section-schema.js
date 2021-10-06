import { updateAll } from './helpers';

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

    delete content.hover;
    delete content.effect.url;
  }
};

const updateToOldContentStructure = content => {
  content.type = content.sourceType;
  delete content.sourceType;

  content.url = content.sourceUrl;
  delete content.sourceUrl;
  content.hover = null;

  if (content.effect && content.effect.type === 'hover') {
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
    await updateAll(this.db.getCollection('documents'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image') {
          return;
        }
        updateToNewContentStructure(section.content);
      });
    });

    await updateAll(this.db.getCollection('documentRevisions'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image') {
          return;
        }
        updateToNewContentStructure(section.content);
      });
    });
  }

  async down() {
    await updateAll(this.db.getCollection('documents'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image') {
          return;
        }
        updateToOldContentStructure(section.content);
      });
    });

    await updateAll(this.db.getCollection('documentRevisions'), { 'sections.type': 'image' }, doc => {
      doc.sections.forEach(section => {
        if (section.type !== 'image') {
          return;
        }
        updateToOldContentStructure(section.content);
      });
    });
  }
}

export default Migration2021100601;

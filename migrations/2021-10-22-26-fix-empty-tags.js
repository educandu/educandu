import { updateAll } from './helpers.js';
import { deStopWords } from './de-stopwords.js';

class Migration2021102601 {
  constructor(db) {
    this.db = db;
  }

  generateTags(revisionOrDocument) {
    const isInGerman = revisionOrDocument.language.toLowerCase() === 'de';
    const defaultTags = [isInGerman ? 'Musik' : 'music'];

    if (!revisionOrDocument.slug || revisionOrDocument.slug.startsWith('http')) {
      return defaultTags;
    }

    const splitByRegex = revisionOrDocument.slug.split(/(?:[-_.\\/\s]|$)/);

    const stopWords = isInGerman ? deStopWords : [];

    const tags = splitByRegex
      .filter(tag => tag.length > 2)
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => !stopWords.some(x => x === tag));

    if (!tags.length) {
      return defaultTags;
    }

    return isInGerman
      ? tags.map(tag => `${tag.slice(0, 1).toUpperCase()}${tag.slice(1).trim()}`)
      : tags;
  }

  async up() {
    await updateAll(this.db.collection('documentRevisions'), { tags: { $eq: null } }, revision => {
      revision.tags = this.generateTags(revision);
    });

    await updateAll(this.db.collection('documents'), { tags: { $eq: null } }, doc => {
      doc.tags = this.generateTags(doc);
    });
  }

  async down() {
    await updateAll(this.db.collection('documentRevisions'), {}, revision => {
      delete revision.tags;
    });

    await updateAll(this.db.collection('documents'), {}, doc => {
      delete doc.tags;
    });
  }
}

export default Migration2021102601;

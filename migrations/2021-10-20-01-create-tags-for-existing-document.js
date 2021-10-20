import { updateAll } from './helpers';
import { deStopWords } from './de-stopwords';

class Migration2021110201 {
  constructor(db) {
    this.db = db;
  }

  generateTags(revisionOrDocument) {
    const isInGerman = revisionOrDocument.language.toLowerCase() === 'de';
    const defaultTags = [isInGerman ? 'Musik' : 'music'];

    if (!revisionOrDocument.slug || revisionOrDocument.slug.startsWith('http')) {
      return defaultTags;
    }

    const splitByRegex = revisionOrDocument.slug.split(/(?:[_.\\/\s]|$)/);

    const splitByDash = splitByRegex.reduce((acc, curr) => [...acc, ...curr.split('-')], []);

    const stopWords = [...isInGerman ? deStopWords : []];

    const tags = splitByDash
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
    await updateAll(this.db.collection('documentRevisions'), {}, revision => {
      revision.tags = this.generateTags(revision);
    });

    await updateAll(this.db.collection('documents'), {}, doc => {
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

export default Migration2021110201;

/* eslint-disable camelcase, no-console, no-await-in-loop */

export default class Educandu_2022_09_08_01_streamline_nulls_in_plugins_part_2 {
  constructor(db) {
    this.db = db;
  }

  tryUpdateSection(section) {
    let sectionWasUpdated = false;

    if (!section.content) {
      return sectionWasUpdated;
    }

    if (section.type === 'pdf-viewer') {
      if (section.content.sourceUrl === null) {
        // Convert null -> empty string
        section.content.sourceUrl = '';
        sectionWasUpdated = true;
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

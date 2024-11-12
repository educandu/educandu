import transliterate from '@sindresorhus/transliterate';

export default class Educandu_2024_11_12_01_add_searchTags_to_documents_and_document_revisions {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    await this.db.collection(collectionName).updateMany({}, { $set: { searchTags: [] } });

    const docsWithTagsIterator = await this.db.collection(collectionName).find({ tags: { $ne: [] } });

    let updateCount = 0;

    for await (const doc of docsWithTagsIterator) {
      updateCount += 1;
      const searchTags = doc.tags.map(tag => transliterate(tag));
      await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { searchTags } });
    }

    return updateCount;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_searchTags_',
        key: { searchTags: 1 }
      },
    ]);

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw Error('Not supported');
  }
}

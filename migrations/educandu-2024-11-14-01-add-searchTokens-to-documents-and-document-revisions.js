import transliterate from '@sindresorhus/transliterate';

export default class Educandu_2024_11_14_01_add_searchTokens_to_documents_and_document_revisions {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    await this.db.collection(collectionName).updateMany({}, { $set: { searchTokens: [] } });

    const docsWithTagsIterator = await this.db.collection(collectionName).find({ tags: { $ne: [] } });

    let updateCount = 0;

    for await (const doc of docsWithTagsIterator) {
      updateCount += 1;
      const searchTokens = doc.tags.map(tag => transliterate(tag));
      await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { searchTokens } });
    }

    return updateCount;
  }

  async up() {
    const documentsCount = await this.processCollection('documents');
    const documentRevisionsCount = await this.processCollection('documentRevisions');

    await this.db.collection('documents').createIndexes([
      {
        name: '_idx_searchTokens_',
        key: { searchTokens: 1 }
      },
    ]);

    console.log(`Updated ${documentsCount} documents and ${documentRevisionsCount} documentRevisions`);
  }

  down() {
    throw Error('Not supported');
  }
}

import transliterate from '@sindresorhus/transliterate';

export default class Educandu_2024_11_14_02_add_searchTokens_to_media_library_items {
  constructor(db) {
    this.db = db;
  }

  async processCollection(collectionName) {
    const docsIterator = await this.db.collection(collectionName).find({});

    let updateCount = 0;

    for await (const doc of docsIterator) {
      updateCount += 1;
      const searchTokens = [...doc.tags.map(tag => transliterate(tag)), transliterate(doc.name)];
      await this.db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { searchTokens } });
    }

    return updateCount;
  }

  async up() {
    const count = await this.processCollection('mediaLibraryItems');

    await this.db.collection('mediaLibraryItems').createIndexes([
      {
        name: '_idx_searchTokens_',
        key: { searchTokens: 1 }
      },
    ]);

    console.log(`Updated ${count} mediaLibraryItems`);
  }

  down() {
    throw Error('Not supported');
  }
}
